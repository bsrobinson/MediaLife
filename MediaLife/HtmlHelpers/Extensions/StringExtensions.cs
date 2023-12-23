namespace MediaLife.HtmlHelpers.Extensions
{
    public static class StringExtensions
    {
        public static string ToCamelCase(this string s)
            => s.Length > 0 ? s[..1].ToLower() + s[1..] : s;
    }
}