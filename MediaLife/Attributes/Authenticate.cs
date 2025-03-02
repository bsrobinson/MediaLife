using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using MediaLife.Library.DAL;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace MediaLife.Attributes
{
	public class AuthorisedAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            MySqlContext db = context.HttpContext.RequestServices.GetRequiredService<MySqlContext>();

            if (context.HttpContext.Request.Cookies.TryGetValue("auth_key", out string? cookieValue))
            {
                List<User> users = db.Users.ToList();
                User? user = users.FirstOrDefault(u => u.Password == cookieValue);
                if (user != null)
                {
                    //Login successful, extend cookie
                    context.HttpContext.Response.Cookies.Append("auth_key", cookieValue, new() { Expires = DateTime.Now.AddYears(1) });
                    context.HttpContext.User = new ClaimsPrincipal(new ApplicationUser(user, users));

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
        public List<User> OtherAccountUsers { get; }
        public override string Name => User.Name;
        public override bool IsAuthenticated => true;

        public ApplicationUser(User user, List<User> allUsers)
        {
            User = user;
            OtherAccountUsers = allUsers.Where(u => u.AccountId == user.AccountId && u.UserId != user.UserId).ToList();
        }
    }

    public static class ClaimsPrincipalExtensions
    {
        public static User Obj(this ClaimsPrincipal principal)
        {
            if (principal.Identity is ApplicationUser applicationUser)
            {
                return applicationUser.User;
            }
            throw new Exception("Invalid identity object");
        }
    }
}