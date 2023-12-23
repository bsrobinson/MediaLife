using System;
using System.Collections.Generic;
using System.Linq;
using MediaLife.Attributes;
using MediaLife.Library.DAL;
using Microsoft.AspNetCore.Mvc;
using WCKDRZR.Gaspar;

namespace MediaLife.Controllers
{
    public class LoginController : Controller
    {
        private readonly MySqlContext db;

        public LoginController(MySqlContext context)
        {
            db = context;
        }

        [HttpGet("[controller]")]
        public IActionResult Index()
        {
            if (Request.Cookies.ContainsKey("auth_key"))
            {
                return new RedirectResult("/Logout");
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

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]")]
        public ActionResult<List<string>> ResetPassKey()
        {
            if (Request.Cookies.TryGetValue("auth_key", out string? cookieValue))
            {
                User? user = db.Users.FirstOrDefault(u => u.Password == cookieValue);
                if (user != null)
                {
                    user.Password = Guid.NewGuid().ToString();
                    db.SaveChanges();

                    return new List<string> { user.Password };
                }
            }

            return BadRequest();
        }
    }
}