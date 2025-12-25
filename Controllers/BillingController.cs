using Microsoft.AspNetCore.Mvc;
using MCPApi.Models;
using MCPApi.Services;
using Microsoft.AspNetCore.Authorization;

namespace MCPApi.Controllers;

// [Authorize]
[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly JsonFileStore _store;
    public BillingController(JsonFileStore store) => _store = store;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _store.GetBillings());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) =>
        await _store.GetBilling(id) is Billing b ? Ok(b) : NotFound();

    [HttpPost]
    public async Task<IActionResult> Create(Billing billing)
    {
        var b = await _store.AddBilling(billing);
        return b is null ? BadRequest("Invalid ProductId or CustomerId") : CreatedAtAction(nameof(Get), new { id = b.Id }, b);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _store.DeleteBilling(id);
        return ok ? NoContent() : NotFound();
    }
}
