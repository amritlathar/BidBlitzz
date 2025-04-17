# API Documentation

## User APIs
Base path: `/api/users/`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register a new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/get-user` | Get current user details | Yes |
| PUT | `/update-user` | Update user profile | Yes |
| PUT | `/update-password` | Update user password | Yes |
| DELETE | `/delete-user` | Delete user account | Yes |

## Auction APIs 
Base path: `/api/auctions/`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create` | Create new auction | Yes |
| GET | `/get-all` | Get all auctions | Yes |
| GET | `/search` | Search auctions | Yes |
| GET | `/status/:status` | Get auctions by status | Yes |
| GET | `/get-by-id/:id` | Get specific auction details | Yes |
| PUT | `/update/:id` | Update auction details | Yes |
| PUT | `/update-winners` | Update auction winners | Yes |
| DELETE | `/delete/:id` | Delete an auction | Yes |

## Bid APIs
Base path: `/api/bids/`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create` | Place a new bid | Yes |
| GET | `/get-auction-bids/:auctionId` | Get all bids for specific auction | Yes |
| GET | `/get-user-bids` | Get all bids placed by current user | Yes |

## Additional Notes

- Authentication is handled through the `verifyJwt` middleware
- All authenticated endpoints require a valid JWT token
- APIs follow RESTful conventions
- All responses include:
  - `success`: Boolean indicating request status
  - `message`: Description of the result
  - `data`: Requested data (if applicable)
  - `error`: Error details (if applicable)
