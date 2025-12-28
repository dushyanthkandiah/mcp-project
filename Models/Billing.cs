namespace MCPApi.Models;

public class Billing
{
    public int Id { get; set; }

    public int ProductId { get; set; }
    public int CustomerId { get; set; }
    public int CreatedBy { get; set; }

    public decimal Total { get; set; }

    // Navigation properties
    public Product? Product { get; set; }
    public Customer? Customer { get; set; }
    public User? CreatedByUser { get; set; }
}
