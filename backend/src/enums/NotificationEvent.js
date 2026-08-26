const NotificationEvent = Object.freeze({
  ORDER: 'ORDER',
  DELIVERY: 'DELIVERY',
  PAYMENT: 'PAYMENT',
  SYSTEM: 'SYSTEM',
  // Onboarding events (internal)
  NEW_RESTAURANT_APPLICATION: 'NEW_RESTAURANT_APPLICATION',
  NEW_RIDER_APPLICATION: 'NEW_RIDER_APPLICATION',
});

export default NotificationEvent;
