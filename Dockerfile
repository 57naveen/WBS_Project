# Use Python base image
FROM python:3.9

# Set the working directory
WORKDIR /wbs

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy Django project files
COPY . .

# Expose the default Django port
EXPOSE 8080

# Run Django server
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "pm.wsgi:application"]
