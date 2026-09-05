import { Review, Order, OrderItem, Restaurant, User, Notification } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @desc    Submit a review for an order (Food & Rider individually)
 * @route   POST /api/v1/reviews
 * @access  Private (Customer)
 */
export const createReview = async (req, res, next) => {
  try {
    const {
      orderId,
      foodRating,
      foodReview,
      foodTags,
      riderRating,
      riderReview,
      riderTags,
      itemRatings,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required to submit a review.',
      });
    }

    const parsedFoodRating = parseInt(foodRating, 10);
    if (isNaN(parsedFoodRating) || parsedFoodRating < 1 || parsedFoodRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Food rating must be between 1 and 5 stars.',
      });
    }

    // Find the order
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Restaurant, as: 'restaurant' },
        { model: OrderItem, as: 'items' },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Check ownership
    if (order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only review orders that you have placed.',
      });
    }

    // Ensure order is delivered
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'You can only submit reviews for delivered orders.',
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ where: { orderId: order.id } });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this order.',
      });
    }

    // Validate rider rating if provided
    let parsedRiderRating = null;
    if (riderRating !== undefined && riderRating !== null && riderRating !== '') {
      parsedRiderRating = parseInt(riderRating, 10);
      if (isNaN(parsedRiderRating) || parsedRiderRating < 1 || parsedRiderRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rider rating must be between 1 and 5 stars.',
        });
      }
    }

    const review = await Review.create({
      orderId: order.id,
      userId: req.user.id,
      restaurantId: order.restaurantId,
      riderId: order.riderId || null,
      foodRating: parsedFoodRating,
      foodReview: foodReview ? foodReview.trim() : '',
      foodTags: Array.isArray(foodTags) ? foodTags : [],
      riderRating: parsedRiderRating,
      riderReview: riderReview ? riderReview.trim() : '',
      riderTags: Array.isArray(riderTags) ? riderTags : [],
      itemRatings: Array.isArray(itemRatings) ? itemRatings : [],
    });

    // Notify Restaurant Owner
    try {
      if (order.restaurant?.userId) {
        await Notification.create({
          userId: order.restaurant.userId,
          title: '⭐ New Customer Review',
          message: `A customer gave a ${parsedFoodRating}-star rating for Order #${order.id}.`,
          type: 'ORDER_UPDATE',
          link: `/restaurant/history`,
        });
      }

      // Notify Rider if reviewed
      if (order.riderId && parsedRiderRating) {
        await Notification.create({
          userId: order.riderId,
          title: '⭐ New Delivery Rating',
          message: `Customer gave you a ${parsedRiderRating}-star rating for delivery #${order.id}.`,
          type: 'ORDER_UPDATE',
          link: `/rider/history`,
        });
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch review notification:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your ratings and review have been submitted successfully.',
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get review for a specific order
 * @route   GET /api/v1/reviews/order/:orderId
 * @access  Private
 */
export const getReviewByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const review = await Review.findOne({
      where: { orderId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      review: review || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public reviews and aggregated rating stats for a restaurant
 * @route   GET /api/v1/reviews/restaurant/:restaurantId
 * @access  Public
 */
export const getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    const reviews = await Review.findAll({
      where: { restaurantId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'createdAt'],
          include: [
            {
              model: OrderItem,
              as: 'items',
              attributes: ['id', 'foodName', 'quantity'],
            },
          ],
        },
      ],
    });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const tagCounts = {};

    reviews.forEach((r) => {
      const rating = r.foodRating;
      sumRating += rating;
      if (ratingBreakdown[rating] !== undefined) {
        ratingBreakdown[rating] += 1;
      }

      if (Array.isArray(r.foodTags)) {
        r.foodTags.forEach((t) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });

    const averageRating = totalReviews > 0 ? parseFloat((sumRating / totalReviews).toFixed(1)) : 5.0;

    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      stats: {
        totalReviews,
        averageRating,
        ratingBreakdown,
        popularTags,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get authenticated restaurant's reviews
 * @route   GET /api/v1/reviews/my-restaurant
 * @access  Private (Restaurant Owner)
 */
export const getMyRestaurantReviews = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    req.params.restaurantId = restaurant.id;
    return getRestaurantReviews(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get authenticated rider's reviews & performance score
 * @route   GET /api/v1/reviews/my-rider
 * @access  Private (Rider)
 */
export const getMyRiderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: {
        riderId: req.user.id,
        riderRating: { [Op.not]: null },
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'createdAt', 'deliveryAddressText'],
        },
      ],
    });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const tagCounts = {};

    reviews.forEach((r) => {
      const rating = r.riderRating;
      sumRating += rating;
      if (ratingBreakdown[rating] !== undefined) {
        ratingBreakdown[rating] += 1;
      }

      if (Array.isArray(r.riderTags)) {
        r.riderTags.forEach((t) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });

    const averageRating = totalReviews > 0 ? parseFloat((sumRating / totalReviews).toFixed(1)) : 5.0;

    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      stats: {
        totalReviews,
        averageRating,
        ratingBreakdown,
        popularTags,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer's submitted reviews
 * @route   GET /api/v1/reviews/my-reviews
 * @access  Private (Customer)
 */
export const getCustomerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo', 'slug'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'createdAt', 'total'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
