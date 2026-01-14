using Microsoft.AspNetCore.Mvc;
using MCPApi.Models;
using MCPApi.Services;
using Microsoft.AspNetCore.Authorization;

namespace MCPApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly JsonFileStore _store;
    public ProductController(JsonFileStore store) => _store = store;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _store.GetProducts());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) =>
        await _store.GetProduct(id) is Product p ? Ok(p) : NotFound();

    [HttpPost]
    public async Task<IActionResult> Create(Product product)
    {
        var p = await _store.AddProduct(product);
        return p is null ? BadRequest("Invalid CreatedBy user") : CreatedAtAction(nameof(Get), new { id = p.Id }, p);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Product input)
    {
        var ok = await _store.UpdateProduct(id, input);
        return Ok(ok);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _store.DeleteProduct(id);
        return Ok(ok);
    }
}
