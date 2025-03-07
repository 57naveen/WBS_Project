# Start Celery
  - celery -A pm worker --pool=solo --loglevel=info

# Run Redis in Docker
  - docker run --name redis -d -p 6379:6379 redis

# Delete All Records from All Tables in the Database

  from django.apps import apps

  all_models = apps.get_models()

  for model in all_models:
      model.objects.all().delete()
      print(f"Deleted all records from {model.__name__}")

# Reset Auto-Increment (IDENTITY) in SQL Server

  from django.db import connection

  def reset_identity(table_name):
        with connection.cursor() as cursor:
            cursor.execute(f"DBCC CHECKIDENT ('{table_name}', RESEED, 0);")
            print(f"✅ Reset identity for {table_name}")


  reset_identity('wbs_employee')  # Replace with your actual table name
  reset_identity('wbs_task')  # Reset another table if needed
  reset_identity('wbs_taskassignment')  # Reset TaskAssignment table
  reset_identity('wbs_project') 




# daphne command
daphne -b 0.0.0.0 -p 8000 pm.asgi:application

#  Set Up WebSocket Connection in React
npm install socket.io-client
