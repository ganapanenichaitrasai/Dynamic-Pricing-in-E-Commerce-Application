const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../server");
const User = require("../models/user");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Mock nodemailer
jest.mock("nodemailer", () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({
            messageId: "test-message-id"
        })
    })
}));

let mongoServer;
let authToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect(); // Disconnect from any active connections
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Clear mocks before tests
    jest.clearAllMocks();
});

afterAll(async () => {
    try {
        await mongoose.connection.close(); // Close MongoDB connection
        
        // Only close server if it exists and has a close method
        if (server && typeof server.close === 'function') {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    } catch (error) {
        console.error("Error during test cleanup:", error);
    }

    // Clear mocks after tests
    jest.clearAllMocks();
});

beforeEach(async () => {
    await User.deleteMany({});
    
    // Create a test user for authentication tests
    const testUser = new User({
        username: "existinguser",
        email: "existing@example.com",
        password: await require("bcryptjs").hash("password123", 10),
        role: "user"
    });
    await testUser.save();

    // Generate a token for authenticated routes
    authToken = jwt.sign(
        { userId: testUser._id, role: testUser.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: "1h" }
    );

    // Reset nodemailer mock before each test
    nodemailer.createTransport().sendMail.mockClear();
});

// Existing test cases (previous implementation)

// Rest of the test suite remains the same as in the previous implementation
// ... (other test cases)
// Signup Tests
describe("Authentication Signup", () => {
    test("Signup a new user", async () => {
        const response = await request(app).post("/api/auth/signup").send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
            role: "user",
        });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User registered successfully");
    });

    test("Signup with existing username should fail", async () => {
        const response = await request(app).post("/api/auth/signup").send({
            username: "existinguser",
            email: "newuser@example.com",
            password: "password123",
            role: "user",
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Username already exists");
    });

    test("Signup with missing required fields should fail", async () => {
        const response = await request(app).post("/api/auth/signup").send({
            username: "partialuser",
        });

        expect(response.status).toBe(500);
        expect(response.body.message).toBe("Server Error");
    });
});

// Login Tests
describe("Authentication Login", () => {
    test("Login with valid credentials", async () => {
        const response = await request(app).post("/api/auth/login").send({
            username: "existinguser",
            password: "password123",
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");
        expect(response.body.token).toBeTruthy();
    });

    test("Login with invalid username", async () => {
        const response = await request(app).post("/api/auth/login").send({
            username: "nonexistentuser",
            password: "password123",
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid Credentials");
    });

    test("Login with incorrect password", async () => {
        const response = await request(app).post("/api/auth/login").send({
            username: "existinguser",
            password: "wrongpassword",
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid Credentials");
    });
});

// Profile Tests
describe("User Profile", () => {
    test("Get user profile with authentication", async () => {
        const response = await request(app)
            .get("/api/auth/profile")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.username).toBe("existinguser");
        expect(response.body.password).toBeUndefined();
    });

    test("Update user profile", async () => {
        const response = await request(app)
            .put("/api/auth/profile")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                username: "updateduser",
                email: "updated@example.com"
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Profile updated successfully");
    });

    test("Profile update without authentication should fail", async () => {
        const response = await request(app)
            .put("/api/auth/profile")
            .send({
                username: "updateduser",
                email: "updated@example.com"
            });

        expect(response.status).toBe(401);
    });
});

// Password Reset Tests
describe("Forgot Password", () => {
    test("Forgot password request for existing email", async () => {
        // Set up the mock to return a resolved promise
        const mockSendMail = nodemailer.createTransport().sendMail;

        const response = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "existing@example.com" });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Password reset link sent to your email");
        
        // Verify that sendMail was called
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        
        // Optional: Check email details if needed
        const mailOptions = mockSendMail.mock.calls[0][0];
        expect(mailOptions.to).toBe("existing@example.com");
    });

    test("Forgot password request for non-existing email", async () => {
        const response = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "nonexistent@example.com" });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("User not found");
    });
});
// Authentication Check
describe("Authentication Status", () => {
    test("Check authentication with valid token", async () => {
        const response = await request(app)
            .get("/api/auth/check-auth")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.isAuthenticated).toBe(true);
        expect(response.body.user).toBeTruthy();
    });

    test("Check authentication with invalid token", async () => {
        const response = await request(app)
            .get("/api/auth/check-auth")
            .set("Authorization", "Bearer invalidtoken");

        expect(response.status).toBe(401);
        expect(response.body.isAuthenticated).toBe(false);
    });
});

// Logout Test
describe("Logout", () => {
    test("Logout route", async () => {
        const response = await request(app)
            .post("/api/auth/logout");

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Logged out successfully");
    });
});

// const request = require("supertest");
// const mongoose = require("mongoose");
// const { app, server } = require("../server");
// const User = require("../models/user");
// const { MongoMemoryServer } = require("mongodb-memory-server");

// let mongoServer;

// beforeAll(async () => {
//     mongoServer = await MongoMemoryServer.create();
//     await mongoose.disconnect(); // Disconnect from any active connections
//     const mongoUri = mongoServer.getUri();
//     await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
// });

// afterAll(async () => {
//     await mongoose.connection.close(); // Close MongoDB connection
//     server.close(); // Close Express server
// });

// beforeEach(async () => {
//     await User.deleteMany({});
// });

// test("Signup a new user", async () => {
//     const response = await request(app).post("/api/auth/signup").send({
//         username: "testuser",
//         email: "test@example.com",
//         password: "password123",
//         role: "user",
//     });

//     expect(response.status).toBe(201);
//     expect(response.body.message).toBe("User registered successfully");
// });
