using Microsoft.EntityFrameworkCore;
using MCPApi.Models;
using MCPApi.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

 
// runtime toggle: set UseFileStore=true in configuration to use file-backed NoSQL store
var useFileStore = builder.Configuration.GetValue<bool>("UseFileStore", false);

builder.Services.AddSingleton<JsonFileStore>();

builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services
    .AddAuthentication("Google")
    .AddScheme<AuthenticationSchemeOptions, GoogleAuthenticationHandler>(
        "Google", options => { });
builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// Seed data (either into the EF in-memory DB or the file store depending on toggle)
using (var scope = app.Services.CreateScope())
{
    var store = scope.ServiceProvider.GetRequiredService<JsonFileStore>();
    // seed products
    var products = store.GetProducts().GetAwaiter().GetResult();
    if (!products.Any())
    {
        store.AddProduct(new Product { Name = "Apple", Price = 0.5m }).GetAwaiter().GetResult();
        store.AddProduct(new Product { Name = "Banana", Price = 0.3m }).GetAwaiter().GetResult();
    }
    var customers = store.GetCustomers().GetAwaiter().GetResult();
    if (!customers.Any())
    {
        store.AddCustomer(new Customer { Name = "Alice", Email = "alice@example.com" }).GetAwaiter().GetResult();
        store.AddCustomer(new Customer { Name = "Bob", Email = "bob@example.com" }).GetAwaiter().GetResult();
    }
    var billings = store.GetBillings().GetAwaiter().GetResult();
    if (!billings.Any())
    {
        var firstProduct = store.GetProducts().GetAwaiter().GetResult().FirstOrDefault();
        var firstCustomer = store.GetCustomers().GetAwaiter().GetResult().FirstOrDefault();
        if (firstProduct is not null && firstCustomer is not null)
        {
            store.AddBilling(new MCPApi.Models.Billing
            {
                ProductId = firstProduct.Id,
                CustomerId = firstCustomer.Id,
                Total = firstProduct.Price
            }).GetAwaiter().GetResult();
        }
    }
}

app.MapControllers();

app.Run();
