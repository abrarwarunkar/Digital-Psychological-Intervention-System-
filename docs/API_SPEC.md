# API Specification

## Authentication

### Register
- **POST** `/api/auth/register`
- **Body**: `{ name, email, password, role, consent }`
- **Response**: `201 Created` - `{ accessToken, refreshToken }`

### Login
- **POST** `/api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `200 OK` - `{ accessToken, refreshToken }`

### Refresh Token
- **POST** `/api/auth/refresh`
- **Body**: `{ refreshToken }`
- **Response**: `200 OK` - `{ accessToken }`

### Logout
- **POST** `/api/auth/logout`
- **Body**: `{ refreshToken }`
- **Response**: `200 OK`

## Users

### Get Profile
- **GET** `/api/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - User Profile Object

### Update Profile
- **PUT** `/api/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ profile, anonymousPref }`
- **Response**: `200 OK` - Updated Profile

## Screening

### Submit Screening
- **POST** `/api/screening`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ type: "PHQ9"|"GAD7", answers: [{qid, answer}] }`
- **Response**: `201 Created` - `{ score, riskLevel }`

### Get User History
- **GET** `/api/screening/user`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` - List of past results

## Bookings

### Get Counsellor Availability
- **GET** `/api/counsellors/:id/availability`
- **Response**: `200 OK` - List of available slots

### Create Booking
- **POST** `/api/bookings`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ counsellorId, slot: { date, startTime, endTime } }`
- **Response**: `201 Created` - Booking Object

## Chatbot

### Create Session
- **POST** `/api/chat/session`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `201 Created` - `{ sessionId }`

### Send Message
- **POST** `/api/chat/:sessionId/message`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ message, anonymity }`
- **Response**: `200 OK` - `{ reply }`

## Resources

### List Resources
- **GET** `/api/resources`
- **Query**: `?tag=...&lang=...`
- **Response**: `200 OK` - List of resources

## Forum

### Create Post
- **POST** `/api/forum/posts`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ title, content, tags }`
- **Response**: `201 Created` - Post Object

### List Posts
- **GET** `/api/forum/posts`
- **Response**: `200 OK` - List of posts
