using System.Linq;
using MediaLife.Library.DAL;
using Microsoft.AspNetCore.Mvc;
using WCKDRZR.Gaspar;

namespace MediaLife.Controllers
{
    public class LoginController : Controller
    {
        private MySqlContext db;

        public LoginController(MySqlContext context)
        {
            db = context;
        }

        [HttpGet("[controller]")]
        public IActionResult Index(string authKey)
        {
            if (Request.Cookies.ContainsKey("auth_key"))
            {
                return new RedirectResult("/");
            }

            ViewBag.AccountCount = db.UserAccounts.Count();
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
            return new RedirectResult("/Login");
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]")]
        public ActionResult<User> CreateFirstUser([FromBody] User user)
        {
            if (db.UserAccounts.Count() > 0)
            {
                return BadRequest();
            }

            UserAccount newAccount = new() { Name = $"{user.Name}'s Account" };
            db.UserAccounts.Add(newAccount);
            db.SaveChanges();

            user.AccountId = newAccount.AccountId;
            db.Users.Add(user);
            db.SaveChanges();

            return user;
        }
    }
}