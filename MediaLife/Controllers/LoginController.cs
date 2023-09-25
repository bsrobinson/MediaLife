using Microsoft.AspNetCore.Mvc;

namespace MediaLife.Controllers
{
    public class LoginController : Controller
    {
        [HttpGet("[controller]")]
        public IActionResult Index(string authKey)
        {
            if (Request.Cookies.ContainsKey("auth_key"))
            {
                return new RedirectResult("/");
            }
            return View();
        }

        [HttpGet("[controller]/{authKey}")]
        public IActionResult Login(string authKey)
        {
            Response.Cookies.Append("auth_key", authKey);
            return new RedirectResult("/");
        }

        [HttpGet("Logout")]
        public IActionResult Logout(string authKey)
        {
            Response.Cookies.Delete("auth_key");
            return new RedirectResult("/");
        }
    }
}