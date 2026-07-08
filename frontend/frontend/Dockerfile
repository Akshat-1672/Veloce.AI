FROM nginx:alpine
RUN sed -i 's/application\/javascript.*js;/application\/javascript js ts tsx;/g' /etc/nginx/mime.types
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
