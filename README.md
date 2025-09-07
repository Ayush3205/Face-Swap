# Face Swap App

A server-rendered web application built with Node.js, Express, EJS, and MongoDB that allows users to submit photos for AI-powered face swapping using the Remaker API.

## 🚀 Features

- **User-friendly form** with comprehensive validation
- **Camera integration** with front/back camera switching
- **File upload** with drag-and-drop support
- **Real-time image preview** before submission
- **AI-powered face swapping** using Remaker API
- **Secure file handling** with size and format validation
- **MongoDB Atlas integration** for data persistence
- **Responsive design** with Bootstrap 5
- **Server-side rendering** with EJS templates
- **Input sanitization** and XSS protection
- **Rate limiting** for API protection

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (native driver, no ORM)
- **Template Engine**: EJS
- **Frontend**: Bootstrap 5, Vanilla JavaScript
- **File Handling**: Multer
- **Image Processing**: Remaker AI API
- **Validation**: Custom middleware with Validator.js
- **Security**: DOMPurify, rate limiting, input sanitization

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB Atlas account
- Remaker AI API key

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/face-swap-app.git
cd face-swap-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/faceswap?retryWrites=true&w=majority

# Remaker AI API Configuration
REMAKER_API_KEY=your-remaker-api-key-here
REMAKER_API_URL=https://api.remaker.ai/v1/face-swap

```

### 4. Create Upload Directories

```bash
mkdir -p public/uploads/original
mkdir -p public/uploads/swapped
```

### 5. Set Up MongoDB Atlas

1. Create a MongoDB Atlas account at [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string and add it to the `.env` file
5. Whitelist your IP address in the network access settings

### 6. Get Remaker API Key

1. Sign up at [Remaker AI](https://remaker.ai)
2. Obtain your API key from the dashboard
3. Add the API key to your `.env` file

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📡 API Endpoints

### Web Routes

- `GET /` - Render submission form
- `POST /submit` - Handle form submission with face swap processing
- `GET /submissions` - Display all submissions with pagination
- `GET /submissions/:id/download` - Download face-swapped image

### API Routes

- `GET /submissions/:id` - Get submission details (JSON)
- `DELETE /submissions/:id` - Delete submission (admin)
- `GET /api/stats` - Get submission statistics
- `GET /api/docs` - API documentation
- `GET /health` - Health check endpoint

## 🔍 Form Validation Rules

### Personal Information

- **Name**: 4-30 characters, alphabetic only
- **Email**: Valid email format required
- **Phone**: Exactly 10 digits, numeric only
- **Terms & Conditions**: Must be accepted

### Image Requirements

- **Format**: JPG, JPEG, PNG only
- **Size**: Maximum 2MB
- **Required**: Image upload is mandatory

## 🛡 Security Features

- **Input Sanitization**: All inputs are sanitized using DOMPurify
- **XSS Protection**: HTML tags stripped from user inputs
- **File Validation**: Strict file type and size checking
- **Rate Limiting**: 10 requests per 15-minute window per IP
- **Safe File Storage**: Uploaded files stored outside web root
- **Database Security**: MongoDB injection prevention

## 📁 Project Structure

```
face-swap-app/
├── app.js                  # Main application file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── config/
│   └── database.js       # MongoDB connection
├── controllers/
│   └── submissionController.js # Main controller logic
├── middleware/
│   ├── upload.js         # File upload handling
│   └── validation.js     # Input validation
├── models/
│   └── submission.js     # Database model
├── routes/
│   └── submissionRoutes.js # Route definitions
├── utils/
│   ├── faceSwap.js       # Face swap API integration
│   └── sanitizer.js      # Input sanitization
├── views/
│   ├── layout.ejs        # Base template
│   ├── form.ejs          # Submission form
│   └── submissions.ejs   # Submissions list
├── public/
│   ├── css/
│   │   └── style.css     # Custom styles
│   ├── js/
│   │   └── camera.js     # Camera handling
│   └── uploads/
│       ├── original/     # Original images
│       └── swapped/      # Face-swapped results
```

## 🧪 Sample API Requests

### Submit a Form (POST /submit)

```bash
curl -X POST http://localhost:3000/submit \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "phone=1234567890" \
  -F "terms=on" \
  -F "image=@/path/to/image.jpg"
```

### Get Submissions (GET /submissions)

```bash
curl http://localhost:3000/submissions?page=1&limit=10
```

### Get Submission Details (GET /submissions/:id)

```bash
curl http://localhost:3000/submissions/507f1f77bcf86cd799439011
```

### Download Image (GET /submissions/:id/download)

```bash
curl -O http://localhost:3000/submissions/507f1f77bcf86cd799439011/download
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `REMAKER_API_KEY` | Remaker AI API key | Yes | - |
| `REMAKER_API_URL` | Remaker API endpoint | No | Default URL |
| `NODE_ENV` | Environment mode | No | development |

### File Upload Limits

- Maximum file size: 2MB
- Allowed formats: JPG, JPEG, PNG
- Maximum files per request: 1

### Rate Limiting

- Window: 15 minutes
- Maximum requests: 10 per IP
- Applies to: POST /submit endpoint

## 🐳 Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p public/uploads/original public/uploads/swapped

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t face-swap-app .
docker run -p 3000:3000 --env-file .env face-swap-app
```

## 🚀 Deployment

### Heroku

1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set MONGODB_URI=your-uri`
4. Deploy: `git push heroku main`

### DigitalOcean App Platform

1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy with automatic builds

### Railway

1. Connect GitHub repository
2. Set environment variables
3. Deploy with zero configuration

## 🧪 Testing

### Manual Testing

1. Start the application: `npm run dev`
2. Visit `http://localhost:3000`
3. Fill out the form and submit
4. Check `/submissions` for results

### API Testing with Postman

Import the provided Postman collection for comprehensive API testing.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Verify MongoDB URI format
- Check network access whitelist
- Ensure database user has proper permissions

**Camera Not Working**
- Use HTTPS in production (required for camera access)
- Check browser permissions
- Test with different browsers

**File Upload Errors**
- Verify file size is under 2MB
- Check file format (JPG/PNG only)
- Ensure upload directories exist

**Remaker API Issues**
- Verify API key is correct
- Check API endpoint URL
- Monitor API usage limits

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://your-deployed-app.herokuapp.com)
- [GitHub Repository](https://github.com/yourusername/face-swap-app)
- [API Documentation](https://your-deployed-app.herokuapp.com/api/docs)

## 🙏 Acknowledgments

- [Remaker AI](https://remaker.ai) for face swap API
- [Bootstrap](https://getbootstrap.com) for UI components
- [MongoDB Atlas](https://www.mongodb.com/atlas) for database hosting
- [Express.js](https://expressjs.com) for the web framework
