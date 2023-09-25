using System;
using System.Collections.Generic;
using MediaLife.Models;

namespace MediaLife.Extensions
{
	public static class ListExtensions
	{
        public static T? SecondOrDefault<T>(this List<T> list)
        {
            return (list.Count > 1) ? list[1] : default(T);
        }
    }
}