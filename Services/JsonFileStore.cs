using System.Collections.Concurrent;
using System.Text.Json;
using MCPApi.Models;

namespace MCPApi.Services;

public class JsonFileStore
{
    private readonly string _path;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private DatabaseFile _db = new();

    private class DatabaseFile
    {
        public List<Product> Products { get; set; } = new();
        public List<Customer> Customers { get; set; } = new();
        public List<Billing> Billings { get; set; } = new();
        public int NextProductId { get; set; } = 1;
        public int NextCustomerId { get; set; } = 1;
        public int NextBillingId { get; set; } = 1;
    }

    public JsonFileStore(IWebHostEnvironment env)
    {
        _path = Path.Combine(env.ContentRootPath, "dbstore.json");
        Load().GetAwaiter().GetResult();
    }

    private async Task Load()
    {
        await _lock.WaitAsync();
        try
        {
            if (!File.Exists(_path))
            {
                _db = new DatabaseFile();
                await SaveInternal();
                return;
            }
            var txt = await File.ReadAllTextAsync(_path);
            _db = JsonSerializer.Deserialize<DatabaseFile>(txt) ?? new DatabaseFile();
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task SaveInternal()
    {
        var txt = JsonSerializer.Serialize(_db, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(_path, txt);
    }

    public async Task<IEnumerable<Product>> GetProducts()
    {
        await _lock.WaitAsync();
        try
        {
            return _db.Products.ToList();
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<Product?> GetProduct(int id)
    {
        await _lock.WaitAsync();
        try
        {
            return _db.Products.FirstOrDefault(p => p.Id == id);
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<Product> AddProduct(Product p)
    {
        await _lock.WaitAsync();
        try
        {
            p.Id = _db.NextProductId++;
            _db.Products.Add(p);
            await SaveInternal();
            return p;
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<bool> UpdateProduct(int id, Product input)
    {
        await _lock.WaitAsync();
        try
        {
            var p = _db.Products.FirstOrDefault(x => x.Id == id); if (p == null)
                return false; p.Name = input.Name; p.Price = input.Price; await SaveInternal(); return true;
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<bool> DeleteProduct(int id)
    {
        await _lock.WaitAsync();
        try
        {
            var p = _db.Products.FirstOrDefault(x => x.Id == id);
            if (p == null)
                return false;
            _db.Products.Remove(p);
            await SaveInternal(); return true;
        }
        finally { _lock.Release(); }
    }

    public async Task<IEnumerable<Customer>> GetCustomers()
    {
        await _lock.WaitAsync();
        try
        {
            return _db.Customers.ToList();
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<Customer?> GetCustomer(int id)
    {
        await _lock.WaitAsync();
        try
        {
            return _db.Customers.FirstOrDefault(p => p.Id == id);
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<Customer> AddCustomer(Customer c)
    {
        await _lock.WaitAsync();
        try
        {
            c.Id = _db.NextCustomerId++;
            _db.Customers.Add(c);
            await SaveInternal();
            return c;
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<bool> UpdateCustomer(int id, Customer input)
    {
        await _lock.WaitAsync();
        try
        {
            var c = _db.Customers.FirstOrDefault(x => x.Id == id);
            if (c == null)
                return false;

            c.Name = input.Name;
            c.Email = input.Email;
            c.Age = input.Age;

            await SaveInternal();
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<bool> DeleteCustomer(int id)
    {
        await _lock.WaitAsync();
        try
        {
            var c = _db.Customers.FirstOrDefault(x => x.Id == id);
            if (c == null)
                return false;
            _db.Customers.Remove(c);
            await SaveInternal();
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IEnumerable<Billing>> GetBillings()
    {
        await _lock.WaitAsync();
        try
        {
            return _db.Billings.ToList();
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<Billing?> GetBilling(int id)
    {
        await _lock.WaitAsync();
        try
        {
            return _db.Billings.FirstOrDefault(p => p.Id == id);
        }
        finally { _lock.Release(); }
    }
    public async Task<Billing?> AddBilling(Billing b)
    {
        await _lock.WaitAsync();
        try
        {
            var product = _db.Products.FirstOrDefault(p => p.Id == b.ProductId);
            var customer = _db.Customers.FirstOrDefault(c => c.Id == b.CustomerId);
            if (product is null || customer is null) return null;
            b.Id = _db.NextBillingId++;
            b.Product = product;
            b.Customer = customer;
            _db.Billings.Add(b);
            await SaveInternal();
            return b;
        }
        finally
        {
            _lock.Release();
        }
    }
    public async Task<bool> DeleteBilling(int id)
    {
        await _lock.WaitAsync();
        try
        {
            var b = _db.Billings.FirstOrDefault(x => x.Id == id);
            if (b == null)
                return false;
            _db.Billings.Remove(b);
            await SaveInternal();
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }
}
