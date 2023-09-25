using System;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MediaLife.Attributes
{
	public class Authenticate : ActionFilterAttribute, IActionFilter
    {
        public override void OnActionExecuted(ActionExecutedContext context)
        {
            //localhost allowed without cookie
            if (context.HttpContext.Request.Host.ToString().StartsWith("localhost"))
            {
                return;
            }

            string? envVarValue = Environment.GetEnvironmentVariable("AUTH_KEY");
            if (context.HttpContext.Request.Cookies.TryGetValue("auth_key", out string? cookieValue)
                && cookieValue == envVarValue)
            {
                //Login successful, extend cookie
                CookieOptions cookieOptions = new CookieOptions();
                cookieOptions.Expires = DateTime.Now.AddYears(1);
                context.HttpContext.Response.Cookies.Append("auth_key", cookieValue, cookieOptions);

                return;
            }

            if (string.IsNullOrEmpty(envVarValue))
            {
                byte[] errorMessage = Encoding.UTF8.GetBytes("AUTH_KEY environment variable missing");
                context.HttpContext.Response.Body.WriteAsync(errorMessage, 0, errorMessage.Length);
            }
            context.Result = new UnauthorizedResult();

            return;
        }
    }
}