namespace MCPApi.Models;

public class User
{
    public int Id { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public int CreatedBy { get; set; }
    public User? CreatedByUser { get; set; }
}
