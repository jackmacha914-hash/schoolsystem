const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const Resource = require('./models/Resource');

// Mock user authentication middleware for testing
jest.mock('./middleware/authMiddleware', () => {
  return {
    authenticateUser: (req, res, next) => {
      // Attach a mock user to the request for each test
      req.user = global.mockUser || { _id: '507f1f77bcf86cd799439011', role: 'teacher' };
      next();
    },
    authorizeRoles: (...roles) => (req, res, next) => next(),
  };
});

describe('Resource Upload API', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/testdb', { useNewUrlParser: true, useUnifiedTopology: true });
  });
  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });
  afterEach(async () => {
    await Resource.deleteMany({});
    global.mockUser = undefined;
  });

  it('should upload a PDF file', async () => {
    global.mockUser = { _id: new mongoose.Types.ObjectId(), role: 'teacher' };
    const res = await request(app)
      .post('/api/resources/upload')
      .attach('resource', fs.readFileSync(path.join(__dirname, 'test.pdf')), 'test.pdf')
      .set('Authorization', 'Bearer testtoken');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resource.name).toBe('test.pdf');
  });

  it('should reject non-allowed file types', async () => {
    global.mockUser = { _id: new mongoose.Types.ObjectId(), role: 'teacher' };
    const res = await request(app)
      .post('/api/resources/upload')
      .attach('resource', Buffer.from('test content'), 'test.txt')
      .set('Authorization', 'Bearer testtoken');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject files larger than 10MB', async () => {
    global.mockUser = { _id: new mongoose.Types.ObjectId(), role: 'teacher' };
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
    const res = await request(app)
      .post('/api/resources/upload')
      .attach('resource', bigBuffer, 'bigfile.pdf')
      .set('Authorization', 'Bearer testtoken');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow teachers to delete their own resource', async () => {
    global.mockUser = { _id: new mongoose.Types.ObjectId(), role: 'teacher' };
    // Upload first
    const uploadRes = await request(app)
      .post('/api/resources/upload')
      .attach('resource', fs.readFileSync(path.join(__dirname, 'test.pdf')), 'test.pdf')
      .set('Authorization', 'Bearer testtoken');
    const resourceId = uploadRes.body.resource._id;
    // Delete
    const delRes = await request(app)
      .delete(`/api/resources/${resourceId}`)
      .set('Authorization', 'Bearer testtoken');
    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.success).toBe(true);
  });
});
