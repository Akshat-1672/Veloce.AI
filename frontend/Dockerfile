# Use a lightweight Nginx image to serve the static files
FROM nginx:alpine

# Add TypeScript file extensions to Nginx MIME types so the browser executes them correctly
RUN sed -i 's/application\/javascript.*js;/application\/javascript js ts tsx;/g' /etc/nginx/mime.types

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the application files to the Nginx html directory
COPY . /usr/share/nginx/html

# Expose port 80 for Google Cloud Run
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
