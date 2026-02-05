# Use the lightweight Nginx Alpine image as a base
FROM nginx:alpine

# Copy your website files from the current directory into the Nginx default serving directory inside the container
COPY dist/ /usr/share/nginx/html
