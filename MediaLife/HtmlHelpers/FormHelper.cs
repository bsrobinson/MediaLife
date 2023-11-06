
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Numerics;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace MediaLife.HtmlHelpers
{
    public static class FormRowHelper
    {
        public static IHtmlContent FormRowShortStringFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression)
            => helper.FormRowFor(expression, true, null);

        public static IHtmlContent FormRowShortStringFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression, string label)
            => helper.FormRowFor(expression, true, label);

        public static IHtmlContent FormRowFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression)
            => helper.FormRowFor(expression, false, null);

        public static IHtmlContent FormRowFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression, string label)
            => helper.FormRowFor(expression, false, label);

        public static IHtmlContent FormRowFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression, bool shortString, string? label)
        {
            ModelExpressionProvider expressionProvider = new ModelExpressionProvider(helper.MetadataProvider);
            ModelExpression metadata = expressionProvider.CreateModelExpression(helper.ViewData, expression);

            string id = helper.Id(metadata.Name);
            string type = "text";
            if (metadata.Metadata.ModelType.IsNumeric()) { type = "number"; }
            if (metadata.Metadata.ModelType == typeof(bool)) { type = "checkbox"; }

            List<string> classNames = new() { "field" };
            if (type == "number" || shortString) { classNames.Add("center"); }
            if (type == "checkbox") { classNames.Add(type); }

            string value = $" value=\"{metadata.Model}\"";
            if (type == "checkbox") { value = (bool)metadata.Model ? " checked" : ""; }

            return helper.Raw($"<div class=\"{string.Join(" ", classNames)}\">" +
                $"<label for=\"{id}\">{label ?? metadata.Metadata.DisplayName ?? metadata.Metadata.Name}</label>" +
                $"<input type=\"{type}\" id=\"{id}\" name=\"{metadata.Name}\"{value} />" +
            $"</div>");
        }

        
        public static bool IsNumeric(this Type myType) => NumericTypes.Contains(Nullable.GetUnderlyingType(myType) ?? myType);
        private static readonly HashSet<Type> NumericTypes = new HashSet<Type>
        {
            typeof(int), typeof(double), typeof(decimal), typeof(long), typeof(short), typeof(sbyte), typeof(byte), typeof(ulong), typeof(ushort), typeof(uint), typeof(float)
        };
    }
}