using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace MediaLife.HtmlHelpers.Extensions
{
    public static class EnumExtensions
    {
        public static string DisplayName(this Enum e)
        {
            return e.GetType().GetMember(e.ToString()).First().GetCustomAttribute<DisplayAttribute>()?.Name ?? e.ToString();
        }

        public static List<string> DisplayNameList<TEnum>() where TEnum : Enum
        {
            return ((TEnum[])Enum.GetValues(typeof(TEnum))).Select(v => v.DisplayName()).ToList();
        }

        public static List<TEnum> ToList<TEnum>() where TEnum : Enum
        {
            return ((TEnum[])Enum.GetValues(typeof(TEnum))).ToList();
        }

        public static List<SelectListItem> ToSelectListItems<TEnum>() where TEnum : Enum
        {
            return ToList<TEnum>().Select(e => new SelectListItem(e.DisplayName(), e.ToString("d"))).ToList();
        }
    }
}