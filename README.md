# MCPApi

Minimal .NET API with CRUD endpoints for `Product` and `Customer` using EF Core InMemory.

Prerequisites:
- .NET 8 SDK or later

Run locally:

```powershell
cd MCPApi
dotnet restore
dotnet run
```

The API will be available at `https://localhost:5001` (Swagger at `/swagger`).

Sample requests (curl):

Get products:

```bash
curl https://localhost:5001/api/products -k
```

Create product:

```bash
curl -X POST https://localhost:5001/api/products -H "Content-Type: application/json" -d '{"name":"Orange","price":0.75}' -k
```

Update product:

```bash
curl -X PUT https://localhost:5001/api/products/1 -H "Content-Type: application/json" -d '{"id":1,"name":"Updated","price":1.23}' -k
```

Delete product:

```bash
curl -X DELETE https://localhost:5001/api/products/1 -k
```
