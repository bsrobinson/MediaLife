using System;
using System.Linq;
using System.Security.Claims;
using MediaLife.Library.DAL;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace MediaLife.Attributes
{
	public class Authenticate : ActionFilterAttribute, IActionFilter
    {
        public override void OnActionExecuted(ActionExecutedContext context)
        {
            MySqlContext db = context.HttpContext.RequestServices.GetRequiredService<MySqlContext>();

            if (context.HttpContext.Request.Cookies.TryGetValue("auth_key", out string? cookieValue))
            {
                User? user = db.Users.FirstOrDefault(u => u.Password == cookieValue);
                if (user != null)
                {
                    //Login successful, extend cookie
                    context.HttpContext.Response.Cookies.Append("auth_key", cookieValue, new() { Expires = DateTime.Now.AddYears(1) });

                    if (context.Controller is Controller controller)
                    {   
                        context.HttpContext.User = new ClaimsPrincipal(new ApplicationUser(user));
                    }

                    return;
                }
                else
                {
                    context.HttpContext.Response.Cookies.Delete("auth_key");
                }
            }
            
            context.Result = new RedirectResult("/Login");

            return;
        }        
    }

    public class ApplicationUser : ClaimsIdentity
    {
        public User User { get; }
        public override string Name => User.Name;
        public override bool IsAuthenticated => true;

        public ApplicationUser(User user)
        {
            User = user;
        }
    }
}