const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testFlagApi = async () => {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'student@test.com',
            password: 'password123'
        });
        console.log('Login response data:', loginRes.data);
        const token = loginRes.data.accessToken; // Use accessToken instead of token
        console.log('Logged in, token received:', token);

        if (!token) {
            console.error('Token is missing!');
            return;
        }

        // 2. Get Posts
        console.log('Fetching posts...');
        const postsRes = await axios.get(`${API_URL}/forum`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const posts = postsRes.data;

        if (posts.length === 0) {
            console.log('No posts found to flag.');
            return;
        }

        const postId = posts[0]._id;
        console.log(`Flagging post: ${postId}`);

        // 3. Flag Post
        await axios.post(`${API_URL}/forum/${postId}/flag`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Post flagged successfully via API.');

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

testFlagApi();
