import { Op, Sequelize } from 'sequelize';
import { 
  Restaurant, 
  DeliveryZone, 
  RestaurantCategory, 
  Food, 
  FoodVariant, 
  RestaurantAddon,
  Review 
} from '../models/index.js';
import { RestaurantStatus } from '../enums/index.js';

/**
 * @desc    Get all active/approved restaurants
 * @route   GET /api/v1/public/restaurants
 * @access  Public
 */
export const getPublicRestaurants = async (req, res, next) => {
  try {
    const { zone, search, category } = req.query;

    const where = { status: RestaurantStatus.ACTIVE };

    const include = [
      {
        model: DeliveryZone,
        as: 'deliveryZones',
        through: { attributes: [] }
      }
    ];

    // Filter by selected delivery zone ID
    if (zone) {
      include[0].where = { id: parseInt(zone, 10) };
    }

    // Handle food filters (either platform category or search matching food name)
    const foodWhere = { status: 'ACTIVE' };
    let foodsRequired = false;

    if (category) {
      foodWhere.platformCategoryId = parseInt(category, 10);
      foodsRequired = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { '$foods.name$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category || search) {
      include.push({
        model: Food,
        as: 'foods',
        where: foodWhere,
        attributes: [],
        required: foodsRequired
      });
    }

    const restaurants = await Restaurant.findAll({
      where,
      include,
      order: [['name', 'ASC']]
    });

    // Query real aggregate review statistics grouped by restaurant
    const reviewStats = await Review.findAll({
      attributes: [
        'restaurantId',
        [Sequelize.fn('AVG', Sequelize.col('food_rating')), 'avgRating'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'reviewCount']
      ],
      group: ['restaurantId'],
      raw: true
    });

    const statsMap = {};
    reviewStats.forEach((st) => {
      statsMap[st.restaurantId] = {
        rating: st.avgRating ? parseFloat(Number(st.avgRating).toFixed(1)) : null,
        reviewCount: parseInt(st.reviewCount, 10) || 0
      };
    });

    const formattedRestaurants = restaurants.map((r) => {
      const rJson = r.toJSON();
      const st = statsMap[r.id];
      rJson.rating = st && st.reviewCount > 0 ? st.rating : null;
      rJson.reviewCount = st ? st.reviewCount : 0;
      return rJson;
    });

    return res.status(200).json({
      success: true,
      count: formattedRestaurants.length,
      restaurants: formattedRestaurants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single approved restaurant and its nested active menu categories & items
 * @route   GET /api/v1/public/restaurants/:slug
 * @access  Public
 */
export const getPublicRestaurantBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const restaurant = await Restaurant.findOne({
      where: { slug, status: RestaurantStatus.ACTIVE },
      include: [
        {
          model: DeliveryZone,
          as: 'deliveryZones',
          through: { attributes: [] }
        }
      ]
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or is currently inactive.'
      });
    }

    // Fetch active categories with active foods, variants, and addons for this restaurant
    const categories = await RestaurantCategory.findAll({
      where: { restaurantId: restaurant.id, status: 'ACTIVE' },
      include: [
        {
          model: Food,
          as: 'foods',
          where: { status: 'ACTIVE' },
          required: false, // Show categories even if they are empty
          include: [
            {
              model: FoodVariant,
              as: 'variants'
            },
            {
              model: RestaurantAddon,
              as: 'addons',
              through: { attributes: [] }
            }
          ]
        }
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Food, as: 'foods' }, 'name', 'ASC']
      ]
    });

    // Calculate real review stats
    const reviews = await Review.findAll({
      where: { restaurantId: restaurant.id },
      attributes: ['foodRating']
    });

    const totalReviews = reviews.length;
    let averageRating = null;
    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.foodRating, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    const restaurantData = restaurant.toJSON();
    restaurantData.rating = averageRating;
    restaurantData.reviewCount = totalReviews;

    return res.status(200).json({
      success: true,
      restaurant: restaurantData,
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get popular active food items
 * @route   GET /api/v1/public/restaurants/foods/popular
 * @access  Public
 */
export const getPublicPopularFoods = async (req, res, next) => {
  try {
    const { zone } = req.query;

    const include = [
      {
        model: Restaurant,
        as: 'restaurant',
        where: { status: RestaurantStatus.ACTIVE },
        include: []
      },
      {
        model: FoodVariant,
        as: 'variants'
      },
      {
        model: RestaurantAddon,
        as: 'addons',
        through: { attributes: [] }
      }
    ];

    if (zone) {
      include[0].include.push({
        model: DeliveryZone,
        as: 'deliveryZones',
        where: { id: parseInt(zone, 10) },
        through: { attributes: [] }
      });
    }

    const foods = await Food.findAll({
      where: { status: 'ACTIVE' },
      include,
      limit: 8
    });

    return res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search and filter food items across restaurants
 * @route   GET /api/v1/public/restaurants/foods/search
 * @access  Public
 */
export const getPublicFoods = async (req, res, next) => {
  try {
    const { zone, search, category } = req.query;

    const where = { status: 'ACTIVE' };

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (category) {
      where.platformCategoryId = parseInt(category, 10);
    }

    const include = [
      {
        model: Restaurant,
        as: 'restaurant',
        where: { status: RestaurantStatus.ACTIVE },
        include: []
      },
      {
        model: FoodVariant,
        as: 'variants'
      },
      {
        model: RestaurantAddon,
        as: 'addons',
        through: { attributes: [] }
      }
    ];

    if (zone) {
      include[0].include.push({
        model: DeliveryZone,
        as: 'deliveryZones',
        where: { id: parseInt(zone, 10) },
        through: { attributes: [] }
      });
    }

    const foods = await Food.findAll({
      where,
      include,
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  } catch (error) {
    next(error);
  }
};
