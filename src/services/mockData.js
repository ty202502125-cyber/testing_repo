export const seedActivities = [
  { id: 'a1', title: 'Coastal Cleanup Morning', description: 'Join the campus community for a morning removing plastic waste and restoring the shoreline. Gloves, bags, and refreshments provided.', date: '2026-10-04', startTime: '07:30', endTime: '11:30', location: 'Baywalk Entrance, Manila', category: 'Environment', spotsAvailable: 18, capacity: 35, status: 'open', organizer: 'Green Campus Society', image: '🌊' },
  { id: 'a2', title: 'Reading Buddies', description: 'Spend an afternoon reading with local elementary students and helping them build confidence with books.', date: '2026-10-07', startTime: '13:00', endTime: '16:00', location: 'San Isidro Community Center', category: 'Tutoring', spotsAvailable: 7, capacity: 20, status: 'open', organizer: 'Community Outreach Office', image: '📚' },
  { id: 'a3', title: 'Campus Garden Day', description: 'Plant herbs, refresh the garden beds, and learn simple composting techniques with our grounds team.', date: '2026-10-11', startTime: '09:00', endTime: '12:00', location: 'North Quad Garden', category: 'Campus Care', spotsAvailable: 12, capacity: 24, status: 'open', organizer: 'Sustainability Council', image: '🌱' },
  { id: 'a4', title: 'Community Pantry Packing', description: 'Pack essential food and care kits for distribution to families in our neighboring communities.', date: '2026-10-15', startTime: '10:00', endTime: '13:00', location: 'Student Union, Room 104', category: 'Community', spotsAvailable: 0, capacity: 30, status: 'open', organizer: 'Student Volunteer Network', image: '🤝' },
  { id: 'a5', title: 'Welcome Week Wayfinders', description: 'Help new students and their families find their way around campus during orientation week.', date: '2026-10-20', startTime: '08:00', endTime: '12:00', location: 'Main Campus Gate', category: 'Campus Care', spotsAvailable: 9, capacity: 16, status: 'open', organizer: 'Student Affairs', image: '🧭' },
  { id: 'a6', title: 'Park Tree Planting', description: 'Work alongside city partners to plant native trees and learn about urban biodiversity.', date: '2026-09-20', startTime: '08:00', endTime: '11:00', location: 'Rizal Park, Manila', category: 'Environment', spotsAvailable: 0, capacity: 25, status: 'completed', organizer: 'Green Campus Society', image: '🌳' },
];

export const seedRecords = [
  { id: 'r1', studentId: 'STU-2026-1042', studentName: 'Maya Santos', activityId: 'a6', activityTitle: 'Park Tree Planting', date: '2026-09-20', hoursLogged: 3, status: 'approved' },
  { id: 'r2', studentId: 'STU-2026-1042', studentName: 'Maya Santos', activityId: 'a1', activityTitle: 'Coastal Cleanup Morning', date: '2026-09-17', hoursLogged: 2.5, status: 'pending' },
  { id: 'r3', studentId: 'STU-2026-2201', studentName: 'Noah Reyes', activityId: 'a3', activityTitle: 'Campus Garden Day', date: '2026-09-16', hoursLogged: 2, status: 'pending' },
  { id: 'r4', studentId: 'STU-2026-1042', studentName: 'Maya Santos', activityId: 'a5', activityTitle: 'Welcome Week Wayfinders', date: '2026-09-12', hoursLogged: 4, status: 'approved' },
  { id: 'r5', studentId: 'STU-2026-3817', studentName: 'Liam Cruz', activityId: 'a2', activityTitle: 'Reading Buddies', date: '2026-09-10', hoursLogged: 1.5, status: 'pending' },
];

export const seedUsers = [
  { id: 'u1', name: 'Maya Santos', email: 'maya@campus.edu', password: 'Campus123!', role: 'student', studentId: 'STU-2026-1042', department: 'Environmental Science' },
  { id: 'u2', name: 'Alex Morgan', email: 'admin@campus.edu', password: 'Campus123!', role: 'admin', studentId: '', department: 'Student Affairs' },
];
