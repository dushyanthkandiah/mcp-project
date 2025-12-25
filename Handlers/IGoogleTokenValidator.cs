using Google.Apis.Auth;

public interface IGoogleTokenValidator
{
    Task<GoogleJsonWebSignature.Payload> ValidateAsync(string token);
}
public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IConfiguration _config;

    public GoogleTokenValidator(IConfiguration config)
    {
        _config = config;
    }

    public async Task<GoogleJsonWebSignature.Payload> ValidateAsync(string token)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[]
            {
                _config["Authentication:GoogleAuth:ClientId"]
            },
            
        };
        string error = "Validating token for audience: " +  _config["Authentication:GoogleAuth:ClientId"];
        Console.WriteLine(error);
        return await GoogleJsonWebSignature.ValidateAsync(token, settings);
    }
}
