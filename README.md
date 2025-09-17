# Jukebox (WIP)

✨ Your new local music server, free of charge✨.

## TODO: Backend
1. Playlist Following/Favorites
Allow users to follow or favorite playlists.
Endpoints to follow/unfollow a playlist.
Endpoint to list playlists a user follows.
Update Prisma schema to support playlist followers.
2. User Profile Features
Endpoint to view user profile (username, avatar, etc.).
Endpoint to update user profile (change username, avatar, bio, etc.).
Endpoint to upload/change avatar image.
Add validation and error handling.
3. Admin/Moderation Endpoints
Endpoints for admin users to:
List all users, songs, playlists.
Ban or delete users.
Remove or feature songs/playlists.
View reports or flagged content.
Add role-based access control (admin vs. regular user).
4. Automated Tests
Write unit tests for controllers and services.
Write integration tests for endpoints.
Test authentication, error handling, and edge cases.
5. Advanced Song Streaming (Optional)
Support HTTP range requests for seeking in audio files.
Return partial content for improved playback experience.
Handle large files and streaming performance.
6. Deployment & Monitoring (Optional)
Prepare for deployment (Docker, environment variables, etc.).
Add logging and monitoring (e.g., request logs, error logs).

## FUTURE FEATURES
- Save user's last played song
- List the last 10 things a user listnend to (artists or playlists)

## MAYBE ????
- Add a podcast section
