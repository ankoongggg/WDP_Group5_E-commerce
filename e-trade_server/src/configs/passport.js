const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Chỉ cấu hình Google Strategy nếu có đủ Client ID và Secret trong .env
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:9999/api/auth/google/callback',
                scope: ['profile', 'email'],
            },
            (accessToken, refreshToken, profile, done) => {
                const email = profile.emails?.[0]?.value || '';
                const photo = profile.photos?.[0]?.value;
                const user = {
                    email: email.toLowerCase(),
                    fullName: profile.displayName || email || 'Google User',
                    avatar: photo,
                    provider: 'google',
                    providerId: profile.id,
                };
                done(null, user);
            }
        )
    );
}

module.exports = passport;
