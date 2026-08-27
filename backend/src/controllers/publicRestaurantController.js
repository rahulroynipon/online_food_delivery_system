import { Op } from 'sequelize';
import { 
  Restaurant, 
  DeliveryZone, 
  RestaurantCategory, 
  Food, 
  FoodVariant, 
  RestaurantAddon 
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

    // Search query on restaurant name (case-insensitive)
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

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

    // Filter by platform category ID (restaurants offering foods matching platformCategoryId)
    if (category) {
      include.push({
        model: Food,
        as: 'foods',
        where: { platformCategoryId: parseInt(category, 10), status: 'ACTIVE' },
        attributes: [], // Don't return all food records in the restaurant listing response
        required: true // Inner join to filter restaurants
      });
    }

    const restaurants = await Restaurant.findAll({
      where,
      include,
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants
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

    return res.status(200).json({
      success: true,
      restaurant,
      categories
    });
  } catch (error) {
    next(error);
  }
};
