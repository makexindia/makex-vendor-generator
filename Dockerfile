# Use lightweight Node.js Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy the builder script and template
COPY build.js .
COPY template.html .

# Run the builder script when the container starts
CMD ["node", "build.js"]