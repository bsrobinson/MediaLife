using System;
using System.Collections.Generic;
using MediaLife.Models;

namespace MediaLife.Extensions
{
	public static class DateTimeExtensions
	{
        public static string? ToRelativeDate(this DateTime dateTime)
        {
            int minutesAgo = (int)Math.Floor(DateTime.Now.Subtract(dateTime).TotalMinutes);
            if (minutesAgo < 60)
            {
                return $"{minutesAgo} minutes ago";
            }

            if (dateTime.Date == DateTime.Today)
            {
                return $"Today - {dateTime:HH:mm}";
            }

            if (dateTime.Date.AddDays(1) == DateTime.Now.Date)
            {
                return $"Yesterday - {dateTime:HH:mm}";
            }

            return $"{dateTime:d MMM - HH:mm}";
        }
    }
}