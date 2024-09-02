const { Event, GuestList } = require('../models'); // Path to your models
const getEvent = require('../utils/event').getEvent; // Path to your getEvent function

// Mock data
const eventSample = {
  id: 1,
  name: 'Sample Event',
  description: 'This is a sample event',
  start_date: new Date('2024-05-21'),
  end_date: new Date('2024-05-22'),
  location_id: 123,
  is_private: 0, // Public event
  link: 'http://example.com',
  creator: 1,
  created_by_id: 1,
  user_id: 1,
  GuestLists: [
    { attending: 1, event_id: 1, user_id: 1 },
    { attending: 1, event_id: 1, user_id: 2 },
    { attending: 0, event_id: 1, user_id: 3 }
  ]
};

// Mock implementation of findByPk
Event.findByPk = jest.fn((id) => {
  if (id === 1) {
    return {
      get: jest.fn(() => eventSample)
    };
  }
  return null;
});

describe('getEvent function', () => {
  test('should return event details with approved guests for a public event', async () => {
    const eventId = 1;
    const event = await getEvent(eventId);
    
    expect(event).toEqual({
      id: 1,
      name: 'Sample Event',
      description: 'This is a sample event',
      start_date: new Date('2024-05-21'),
      end_date: new Date('2024-05-22'),
      location_id: 123,
      is_private: 0, // Public event
      link: 'http://example.com',
      creator: 1,
      created_by_id: 1,
      user_id: 1,
      guest_list: [
        { attending: 1, event_id: 1, user_id: 1 },
        { attending: 1, event_id: 1, user_id: 2 }
      ]
    });
  });

  test('should return event details with all invited users sorted by approval for a private event', async () => {
    const privateEventSample = { ...eventSample, is_private: 1 };
    Event.findByPk.mockImplementationOnce((id) => {
      if (id === 1) {
        return {
          get: jest.fn(() => privateEventSample)
        };
      }
      return null;
    });

    const eventId = 1;
    const event = await getEvent(eventId);
    
    expect(event).toEqual({
      id: 1,
      name: 'Sample Event',
      description: 'This is a sample event',
      start_date: new Date('2024-05-21'),
      end_date: new Date('2024-05-22'),
      location_id: 123,
      is_private: 1, // Private event
      link: 'http://example.com',
      creator: 1,
      created_by_id: 1,
      user_id: 1,
      guest_list: [
        { attending: 1, event_id: 1, user_id: 1 },
        { attending: 1, event_id: 1, user_id: 2 },
        { attending: 0, event_id: 1, user_id: 3 }
      ]
    });
  });

  test('should throw an error if event is not found', async () => {
    Event.findByPk.mockImplementationOnce(() => null);
    
    const eventId = 999;
    await expect(getEvent(eventId)).rejects.toThrow('Event not found');
  });
});