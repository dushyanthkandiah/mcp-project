using Microsoft.AspNetCore.Mvc;
using MCPApi.Services;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace MCPApi.Controllers;

// [Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly JsonFileStore _store;
    public ReportController(JsonFileStore store) => _store = store;

    [HttpGet("total-revenue")]
    public async Task<IActionResult> TotalRevenue()
    {
        var billings = await _store.GetBillings();
        return Ok(billings.Sum(b => b.Total));
    }

    [HttpGet("sales-by-product")]
    public async Task<IActionResult> SalesByProduct()
    {
        var billings = await _store.GetBillings();
        var q = billings.GroupBy(b => b.ProductId).Select(g => new { ProductId = g.Key, Total = g.Sum(b => b.Total) });
        return Ok(q);
    }

    [HttpGet("sales-by-customer")]
    public async Task<IActionResult> SalesByCustomer()
    {
        var billings = await _store.GetBillings();
        var q = billings.GroupBy(b => b.CustomerId).Select(g => new { CustomerId = g.Key, Total = g.Sum(b => b.Total) });
        return Ok(q);
    }
}
