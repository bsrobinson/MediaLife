
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace MediaLife.HtmlHelpers
{
    public class FormElementOptions
    {
        public bool ShortString { get; set; } = false;
        public List<string> ClassNames { get; set; } = new();
        public bool IsRequired { get; set; } = false;
        public Dictionary<string, string> ValidationMessages { get; set; } = new();
        public int? MaxLength { get; set; } = null;
        public object? Minimum { get; set; } = null;
        public object? Maximum { get; set; } = null;
    }

    public static class FormRowHelper
    {
        public static IHtmlContent FormRowFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression, FormElementOptions? options = null)
            => helper.FormRowFor(expression, null, options);

        public static IHtmlContent FormRowFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression, string? label, FormElementOptions? options = null)
        {
            options ??= new();

            ModelExpressionProvider expressionProvider = new ModelExpressionProvider(helper.MetadataProvider);
            ModelExpression metadata = expressionProvider.CreateModelExpression(helper.ViewData, expression);

            label ??= metadata.Metadata.DisplayName ?? metadata.Metadata.Name ?? "";
            string id = helper.Id(metadata.Name);
            string type = "text";
            if (metadata.Metadata.ModelType.IsNumeric()) { type = "number"; }
            if (metadata.Metadata.ModelType == typeof(bool)) { type = "checkbox"; }

            options.IsRequired = metadata.Metadata.IsRequired;
            options.MaxLength = metadata.Metadata.ValidatorMetadata.OfType<MaxLengthAttribute>().FirstOrDefault()?.Length;
            RangeAttribute? range = metadata.Metadata.ValidatorMetadata.OfType<RangeAttribute>().FirstOrDefault();
            if (range != null)
            {
                options.Minimum = range.Minimum;
                options.Maximum = range.Maximum;
            }
            if (options.Minimum == null && metadata.Metadata.ModelType.IsUnsigned()) { options.Minimum = 0; }

            return helper.FormRow(type, id, metadata.Name, label, $"{metadata.Model}", options);
        }

        public static IHtmlContent FormRow(this IHtmlHelper helper, string type, string nameAndId, string label, string? value = null, FormElementOptions? options = null)
            => helper.FormRow(type, nameAndId, nameAndId, label, value ?? "", options);
        
        public static IHtmlContent FormRow(this IHtmlHelper helper, string type, string id, string name, string label, string value, FormElementOptions? options = null)
        {
            options ??= new();
            
            List<string> classNames = new() { "field" };
            if (type == "number" || options.ShortString) { classNames.Add("center"); }
            if (type == "checkbox") { classNames.Add(type); }
            classNames.AddRange(options.ClassNames);

            string reqStar = "";
            if (type != "checkbox" && options.IsRequired) { reqStar = $"<span class=\"required-star\" title=\"{(options.ValidationMessages.ContainsKey("required") ? options.ValidationMessages["required"] : "")}\">*</span>"; }
            //* checkboxes will always have a value, so required isn't valid - may want to check if true (this may need work!)

            string valueOutput = $" value=\"{value}\"";
            if (type == "checkbox") { valueOutput = value.ToUpper().StartsWith("T") || value == "1" ? " checked" : ""; }

            if (options.IsRequired) { options.ValidationMessages.TryAdd("required", $"Field is required."); }
            if (type == "number") { options.ValidationMessages.TryAdd("number", $"Field value must be a number"); }
            if (options.Minimum != null || options.Maximum != null)
            {
                if (options.Minimum != null && options.Maximum != null) { options.ValidationMessages.TryAdd("range", $"Field value must be between {options.Minimum} and {options.Maximum}."); }
                if (options.Minimum != null && options.Maximum == null) { options.ValidationMessages.TryAdd("range", $"Field value must be greater than {options.Minimum}."); }
                if (options.Minimum == null && options.Maximum != null) { options.ValidationMessages.TryAdd("range", $"Field value must be less than {options.Minimum}."); }
                if (options.Minimum != null) { options.ValidationMessages.TryAdd("range-min", $"{options.Minimum}"); }
                if (options.Maximum != null) { options.ValidationMessages.TryAdd("range-max", $"{options.Maximum}"); }
            }
            string validation = "";
            if (options.ValidationMessages.Count > 0)
            {
                validation = " data-val=\"true\" ";
                validation += string.Join(" ", options.ValidationMessages.Select(v => $"data-val-{v.Key}=\"{v.Value}\""));
            }

            string maxLength = "";
            if (options.MaxLength != null) { maxLength = $" maxlength=\"{options.MaxLength}\""; }

            return helper.Raw($"<div class=\"{string.Join(" ", classNames)}\">" +
                $"<label for=\"{id}\">{label}{reqStar}</label>" +
                $"<div class=\"validation-message\" id=\"{id}-validation-message\"></div>" +
                $"<input type=\"{type}\" id=\"{id}\" name=\"{name}\"{valueOutput}{validation}{maxLength} />" +
            $"</div>");
        }

        public static IHtmlContent Button(this IHtmlHelper helper, string label, string? clickEvent = null)
        {
            string clickEventString = clickEvent != null ? $" onclick=\"{clickEvent}\"" : "";
            return helper.Raw($"<input type=\"button\" value=\"{label}\"{clickEventString} />");
        }
        
        public static IHtmlContent SubmitButton(this IHtmlHelper helper, string label = "Submit")
        {
            return helper.Raw($"<input type=\"submit\" value=\"{label}\" />");
        }

        public static IHtmlContent SubmitRow(this IHtmlHelper helper, string label = "Submit")
        {
            return helper.ButtonRow(new() {
                helper.SubmitButton(label)
            });
        }

        public static IHtmlContent ButtonRow(this IHtmlHelper helper, List<IHtmlContent> buttons)
        {
            return helper.Raw($"<div class=\"field buttons\">" +
                string.Join("", buttons) +
            $"</div>");
        }

        public static IHtmlContent FieldSet(this IHtmlHelper helper, string label, List<IHtmlContent> fields)
        {
            return helper.Raw($"<div class=\"field-set\">" +
                $"<div class=\"label\">{label}</div>" +
                string.Join("", fields) +
            $"</div>");
        }

        
        public static bool IsNumeric(this Type myType) => NumericTypes.Contains(Nullable.GetUnderlyingType(myType) ?? myType);
        public static bool IsUnsigned(this Type myType) => UnsignedNumericTypes.Contains(Nullable.GetUnderlyingType(myType) ?? myType);
        
        private static readonly HashSet<Type> NumericTypes = new HashSet<Type>
        {
            typeof(int), typeof(double), typeof(decimal), typeof(long), typeof(short), typeof(sbyte), typeof(byte), typeof(ulong), typeof(ushort), typeof(uint), typeof(float)
        };
        private static readonly HashSet<Type> UnsignedNumericTypes = new HashSet<Type>
        {
            typeof(ulong), typeof(ushort), typeof(uint)
        };
    }
}