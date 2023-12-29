using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using MediaLife.HtmlHelpers.Extensions;

namespace MediaLife.HtmlHelpers
{
    public class FormElementOptions
    {
        public FormRowStyle Style { get; set; } = FormRowStyle.Outline;
        public string? InputType { get; set; } = null;
        public Icon? Icon { get; set; } = null;
        public Icon? IconRight { get; set; } = null;
        public Icon? SecondaryIcon { get;set; } = null;
        public Icon? SecondaryIconRight { get;set; } = null;
        public string? LabelRight { get;set; } = null;
        public string? SecondaryLabel { get;set; } = null;
        public string? SecondaryLabelRight { get;set; } = null;
        public List<SelectListItem>? SelectOptions { get; set; } = null;
        public List<string>? DataList { get; set; } = null;
        public string? DataType { get; set; } = null;
        public string Classes { get; set; } = "";
        public bool WithSelectHandle { get; set; } = false;
        public bool? Required { get; set; } = null;
        public bool? RequiredStarOnRight = false;
        public string? ChangeEvent { get; set; } = null;
        public ValidationTypes ValidationMessages { get; set; } = new();
        public int? MaxLength { get; set; } = null;
        public object? Minimum { get; set; } = null;
        public object? Maximum { get; set; } = null;
    }

    public class FormElementOptions<TSelectListEnum> : FormElementOptions where TSelectListEnum : Enum
    {
        public FormElementOptions()
        {
            SelectOptions = EnumExtensions.ToSelectListItems<TSelectListEnum>();
        }
    }

    public class ValidationTypes
    {
        public string? Required { get; set; }
        public string? Number { get; set; }
        public string? Checked { get; set; }
        public string? Range { get; set; }
        public string? RangeMin { get; set; }
        public string? RangeMax { get; set; }
        public string? Regex { get; set; }
        public string? RegexPattern { get; set; }
        public string? Currency { get; set; }
        public string? Compare { get; set; }
        public string? CompareTo { get; set; }
        public string? CompareOperand { get; set; }
        public string? Datedropdownsrequired { get; set; }
        public string? DatedropdownsrequiredMonthid { get; set; }
        public string? DatedropdownsrequiredYearid { get; set; }
        public string? Ccdateinpast { get; set; }
        public string? CcdateinpastYearid { get; set; }
        public string? Other { get; set; }
    }
    
    public class ButtonOptions
    {
        public ButtonType Type { get; set; } = ButtonType.Button;
        public ButtonColour? Colour { get; set; } = null;
        public bool Thin { get; set; } = false;
        public bool SpaceAfter { get; set; } = false;
        public bool StackedIcon { get; set; } = false;
        public string Classes { get; set; } = "";
        public Icon? Icon { get; set; } = null;
        public Icon? IconRight { get; set; } = null;
        public string? ClickEvent { get; set; } = null;
        public string? Url { get; set; } = null;
        public Dictionary<string, string>? HtmlAttributes = null;
    }

    public class ButtonRowOptions
    {
        public RowJustify Justify { get; set; } = RowJustify.End;
        public bool Thin { get; set; } = false;
        public bool Tight { get; set; } = false;
        public string Classes { get; set; } = "";
        public Dictionary<string, string>? HtmlAttributes = null;
    }

    public enum FormRowStyle
    {
        [Display(Name = "form-field-row-style-outline")]
        Outline,
        [Display(Name = "form-field-row-style-outline form-field-row-style-outline-inset")]
        OutlineInset,
        [Display(Name = "form-field-row-style-block-row")]
        BlockRow,
        [Display(Name = "form-field-row-style-underline")]
        Underline,
        [Display(Name = "form-field-row-style-underline form-field-row-style-underline-hover")]
        UnderlineHover,
        [Display(Name = "form-field-row-style-inline-border")]
        InlineBorder,
        [Display(Name = "form-field-row-style-inline-border form-field-row-style-inline-border-hover")]
        InlineBorderHover,
        [Display(Name = "form-field-row-style-frameless")]
        Frameless,
    }

    public enum ButtonType
    {
        [Display(Name = "button")]
        Button,
        [Display(Name = "submit")]
        Submit,
    }

    public enum ButtonColour
    {
        [Display(Name = "grey")]
        Grey,
        [Display(Name = "default-click")]
        DefaultClick,
        [Display(Name = "green")]
        Green,
        [Display(Name = "red")]
        Red,
        [Display(Name = "transparent")]
        Transparent,
    }

    public enum RowJustify
    {
        [Display(Name = "flex-start")]
        Start,
        [Display(Name = "flex-end")]
        End,
        [Display(Name = "center")]
        Center,
        [Display(Name = "space-between")]
        SpaceBetween,
        [Display(Name = "space-around")]
        SpaceAround,
        [Display(Name = "space-evenly")]
        SpaceEvenly,
    }

    public class ButtonStyleOptions
    {
        public bool? RightAlign { get; set; } = null;
        public bool Thin { get; set; } = false;
        public bool Tight { get; set; } = false;
    }

    public static class FormRowHelper
    {
        public static IHtmlContent HorizontalRule<TModel>(this IHtmlHelper<TModel> helper)
            => helper.Raw("<hr />");

        public static IHtmlContent FormRowFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression, FormElementOptions? options = null)
            => helper.FormRowFor(expression, null, options);

        public static IHtmlContent FormRowFor<TModel, TValue>(this IHtmlHelper<TModel> helper, Expression<Func<TModel, TValue>> expression, string? label, FormElementOptions? options = null)
        {
            options ??= new();

            ModelExpressionProvider expressionProvider = new(helper.MetadataProvider);
            ModelExpression metadata = expressionProvider.CreateModelExpression(helper.ViewData, expression);

            label ??= metadata.Metadata.DisplayName ?? metadata.Metadata.Name ?? "";
            string id = helper.Id(metadata.Name);
            if (options.SelectOptions != null)
            {
                bool numeric = metadata.Metadata.ModelType.IsNumeric();
                if (options.DataType == null && numeric) { options.DataType = "float"; }
                if (!options.SelectOptions.Any(o => o.Selected))
                {
                    int index = options.SelectOptions.FindIndex(o => o.Value == metadata.Model?.ToString());
                    if (index >= 0) { options.SelectOptions[index].Selected = true; }
                }
            }

            options.Required ??= metadata.Metadata.ModelType != typeof(bool) && metadata.Metadata.IsRequired;
            options.MaxLength = metadata.Metadata.ValidatorMetadata.OfType<MaxLengthAttribute>().FirstOrDefault()?.Length;
            RangeAttribute? range = metadata.Metadata.ValidatorMetadata.OfType<RangeAttribute>().FirstOrDefault();
            if (range != null)
            {
                options.Minimum = range.Minimum;
                options.Maximum = range.Maximum;
            }
            if (options.Minimum == null && metadata.Metadata.ModelType.IsUnsigned()) { options.Minimum = 0; }

            if (metadata.Model == null)
            {
                if (metadata.Metadata.ModelType.IsNumeric()) { options.InputType = "number"; }
                if (Nullable.GetUnderlyingType(metadata.Metadata.ModelType) == typeof(bool)) { 
                    options.InputType = "checkbox"; 
                }
            }

            return helper.FormRow(id, metadata.Name, label, metadata.Model, options);
        }

        public static IHtmlContent FormRow(this IHtmlHelper helper, string nameAndId, string? label, FormElementOptions? options = null)
            => helper.FormRow(nameAndId, nameAndId, label, null, options);
        
        public static IHtmlContent FormRow(this IHtmlHelper helper, string nameAndId, string? label, object? value, FormElementOptions? options = null)
            => helper.FormRow(nameAndId, nameAndId, label, value, options);
        
        public static IHtmlContent FormRow(this IHtmlHelper helper, string id, string name, string? label, object? value, FormElementOptions? options = null)
        {
            options ??= new();

            string type = options.InputType ?? "text";
            if (options.InputType == null && value != null)
            {
                if (value.GetType() == typeof(bool)) { type = "checkbox"; }
                if (value.GetType().IsNumeric()) { type = "number"; }
            }
            if (options.SelectOptions != null) { type = "select"; }
            
            List<string> classNames = new() { $"form-field-row-{type}" };
            if (!string.IsNullOrEmpty(options.Classes)) { classNames.Add(options.Classes); }
            if ((type == "number" || type == "checkbox") && options.Style == FormRowStyle.Outline)
            {
                options.Style = FormRowStyle.OutlineInset;
            }
            classNames.Add(options.Style.DisplayName());

            if (options.Required == true) { options.ValidationMessages.Required ??= $"Field is required."; }
            if (type == "number") { options.ValidationMessages.Number ??= $"Field value must be a number"; }
            if (options.Minimum != null || options.Maximum != null)
            {
                if (options.Minimum != null && options.Maximum != null) { options.ValidationMessages.Range ??= $"Field value must be between {options.Minimum} and {options.Maximum}."; }
                if (options.Minimum != null && options.Maximum == null) { options.ValidationMessages.Range ??= $"Field value must be greater than {options.Minimum}."; }
                if (options.Minimum == null && options.Maximum != null) { options.ValidationMessages.Range ??= $"Field value must be less than {options.Minimum}."; }
                if (options.Minimum != null) { options.ValidationMessages.RangeMin ??= $"{options.Minimum}"; }
                if (options.Maximum != null) { options.ValidationMessages.RangeMax ??= $"{options.Maximum}"; }
            }
            string dataAttr = "";
            if (type == "number")
            {
                dataAttr += " data-type=\"float\"";
            }
            if (options.DataType != null)
            {
                dataAttr += $" data-type=\"{options.DataType}\"";
            }

            IEnumerable<string> validationMessages = options.ValidationMessages.GetType().GetProperties()
                .ToDictionary(p => p.Name, p => p.GetValue(options.ValidationMessages)?.ToString())
                .Where(m => m.Value != null).Select(v => $"data-val-{v.Key.ToCamelCase()}=\"{v.Value}\"");
            if (validationMessages.Any())
            {
                dataAttr += " data-val=\"true\" ";
                dataAttr += string.Join(" ", validationMessages);
            }

            string html = $"<form-field-row id=\"formfieldrow_{id}\" class=\"{string.Join(" ", classNames)}\">";

            string primaryLabelHtml = $"{helper.IconOrBlank(options.SecondaryIcon)}";
            if (!string.IsNullOrEmpty(label)) { primaryLabelHtml += $"<span>{label}</span>"; }
            if (options.Required == true && options.RequiredStarOnRight == false) { primaryLabelHtml += $"<span class=\"required-star\" title=\"{(options.ValidationMessages.Required != null ? options.ValidationMessages.Required : "")}\">*</span>"; }
            if (primaryLabelHtml != "") { primaryLabelHtml = $"<span {Attribute("class", "primary-label")}>{primaryLabelHtml}</span>"; }

            string secondaryLabelHtml = $"{helper.IconOrBlank(options.Icon)}";
            if (!string.IsNullOrEmpty(options.SecondaryLabel)) { secondaryLabelHtml += $"<span>{options.SecondaryLabel}</span>"; }
            if (secondaryLabelHtml != "") { secondaryLabelHtml = $"<span {Attribute("class", "secondary-label")}>{secondaryLabelHtml}</span>"; }

            html += $"<label {Attribute("class", "label-left")}{Attribute("for", id)}>{secondaryLabelHtml}{primaryLabelHtml}</label>";

            html += $"<div {Attribute("id", id + "_validation_message")}{Attribute("class", "validation-message")}></div>";

            string focusRing = "<div class=\"focus-ring\"></div>";

            if (type != "select")
            {
                string inputClass = "";
                string valueOutput = Attribute("value", (value ?? "").ToString());
                string checkedOutput = "";
                string datalistAttr = "";
                if (type == "checkbox")
                {
                    valueOutput = "";
                    if ((bool?)value == true) { checkedOutput = "checked "; }
                    inputClass = "switch";
                }
                else if (options.DataList != null)
                {
                    html += $"<datalist id=\"{id}_datalist\">{string.Join("", options.DataList.Select(d => $"<option value=\"{d}\"></option>"))}</datalist>";
                    datalistAttr = Attribute("list", $"{id}_datalist");
                }

                string maxLength = (options.MaxLength != null) ? $" maxlength=\"{options.MaxLength}\"" : "";

                string eventAction = $"this.inputChange(() => {{ {options.ChangeEvent} }})";
                string events = $" onkeyup=\"{eventAction}\" onchange=\"{eventAction}\" oncut=\"{eventAction}\" onpaste=\"{eventAction}\" onblur=\"{eventAction}\"";

                string input = $"<input {Attribute("type", type)}{Attribute("name", name)}{Attribute("id", id)}{Attribute("name", name)}{Attribute("class", inputClass)}{valueOutput}{checkedOutput}{datalistAttr}{dataAttr}{maxLength}{events} />{focusRing}";

                if (type == "checkbox")
                {
                    input = $"<label {Attribute("class", "switch-wrapper")}{Attribute("for", id)}>{input}</label>";
                }
                
                html += input;
            }
            else if (options.SelectOptions != null)
            {
                string optionsHtml = "";
                options.SelectOptions.ForEach(o => optionsHtml += $"<option value=\"{o.Value}\"{(o.Selected ? " selected" : "")}{(o.Disabled ? " disabled" : "")}>{o.Text}</options>");
                html += $"<select {Attribute("id", id)}{Attribute("name", name)}{dataAttr} onchange=\"this.nextSibling.nextSibling.innerHTML = this.options[this.selectedIndex].text; {options.ChangeEvent}\">{optionsHtml}</select>{focusRing}";
                html += $"<div class=\"select-value-display{(options.WithSelectHandle ? " with-handle" : "")}\">{options.SelectOptions.FirstOrDefault(o => o.Selected)?.Text ?? options.SelectOptions.First().Text}</div>";
            }

            string primaryLabelRightHtml = "";
            if (options.Required == true && options.RequiredStarOnRight == true) { primaryLabelRightHtml += $"<span class=\"required-star\" title=\"{(options.ValidationMessages.Required != null ? options.ValidationMessages.Required : "")}\">*</span>"; }
            if (!string.IsNullOrEmpty(options.LabelRight)) { primaryLabelRightHtml += $"<span>{options.LabelRight}</span>"; }
            primaryLabelRightHtml += $"{helper.IconOrBlank(options.SecondaryIconRight)}";
            if (primaryLabelRightHtml != "") { primaryLabelRightHtml = $"<span {Attribute("class", "primary-label")}>{primaryLabelRightHtml}</span>"; }

            string secondaryLabelRightHtml = "";
            if (!string.IsNullOrEmpty(options.SecondaryLabelRight)) { secondaryLabelRightHtml += $"{options.SecondaryLabelRight}"; };
            secondaryLabelRightHtml += $"{helper.IconOrBlank(options.IconRight)}";
            if (secondaryLabelRightHtml != "") { secondaryLabelRightHtml = $"<span {Attribute("class", "secondary-label")}>{secondaryLabelRightHtml}</span>"; }

            html += $"<label {Attribute("class", "label-right")}{Attribute("for", id)}>{primaryLabelRightHtml}{secondaryLabelRightHtml}</label>";

            string script = (options.SelectOptions == null && type != "checkbox") ? $"<script>document.getElementById('formfieldrow_{id}').activateFormRow();</script>" : "";
            return helper.Raw(html + $"</form-field-row>{script}");
        }

        public static IHtmlContent FieldSet(this IHtmlHelper helper, string legend, List<IHtmlContent> fields, FormRowStyle overrideFieldStyle = FormRowStyle.BlockRow)
        {
            string fieldsString = string.Join("", fields);

            foreach (string style in EnumExtensions.DisplayNameList<FormRowStyle>().ToList())
            {
                fieldsString = fieldsString.Replace(style, overrideFieldStyle.DisplayName());
            }

            return helper.Raw($"<form-field-set>" +
                $"<div class=\"label\">{legend}</div>" +
                fieldsString +
            $"</form-field-set>");
        }


        public static IHtmlContent SubmitButton(this IHtmlHelper helper, string label = "Submit", ButtonOptions? options = null)
        {
            options ??= new();
            options.Type = ButtonType.Submit;
            options.Colour ??= ButtonColour.DefaultClick;
            return helper.Button(label, options);
        }

        public static IHtmlContent Button(this IHtmlHelper helper, Icon icon, string? clickEvent, ButtonOptions? options = null, Dictionary<string, string>? htmlAttributes = null)
        {
            options ??= new();
            options.ClickEvent = clickEvent;
            options.Icon = icon;
            options.HtmlAttributes = htmlAttributes;
            return helper.Button("", options);
        }
        
        public static IHtmlContent Button(this IHtmlHelper helper, string label, string? clickEvent, ButtonOptions? options = null, Dictionary<string, string>? htmlAttributes = null)
        {
            options ??= new();
            options.ClickEvent = clickEvent;
            options.HtmlAttributes = htmlAttributes;
            return helper.Button(label, options);
        }
        
        public static IHtmlContent Button(this IHtmlHelper helper, string label, Icon icon, string? clickEvent, ButtonOptions? options = null, Dictionary<string, string>? htmlAttributes = null)
        {
            options ??= new();
            options.ClickEvent = clickEvent;
            options.Icon = icon;
            options.HtmlAttributes = htmlAttributes;
            return helper.Button(label, options);
        }
        
        public static IHtmlContent Button(this IHtmlHelper helper, string label, ButtonOptions? options = null)
        {
            options ??= new();

            List<string> classNames = new() { "form-row-button", $"form-field-row-button-color-{(options.Colour ?? ButtonColour.Grey).DisplayName()}" };
            if (!string.IsNullOrEmpty(options.Classes)) { classNames.Add(options.Classes); }
            if (options.Thin) { classNames.Add("form-field-row-thin"); }
            if (options.SpaceAfter) { classNames.Add("form-field-row-space-after"); }
            if (options.StackedIcon) { classNames.Add("form-field-row-stacked-icon"); }

            string clickEvent = "";
            if (options.Url != null) { clickEvent = Attribute("onclick", $"location.href='{options.Url}';"); }
            if (options.ClickEvent != null) { clickEvent = Attribute("onclick", options.ClickEvent); }

            string button = $"<button {Attribute("type", options.Type.DisplayName())}{Attribute("class", string.Join(" ", classNames))}{Attributes(options.HtmlAttributes)}{clickEvent}>";
            if (options.Icon != null) { button += helper.Icon(options.Icon, null, null, "left-icon"); }
            if (!string.IsNullOrEmpty(label)) { button += $"<span class=\"label\">{label}</span>"; }
            if (options.IconRight != null) { button += helper.Icon(options.IconRight, null, null, "right-icon"); }
            
            return helper.Raw($"{button}</button>");
        }

        public static IHtmlContent SubmitRow(this IHtmlHelper helper, string label = "Submit", ButtonOptions? submitOptions = null, ButtonRowOptions? rowOptions = null, List<IHtmlContent>? otherButtons = null)
        {
            List<IHtmlContent> buttons = otherButtons ?? new();
            buttons.Add(helper.SubmitButton(label, submitOptions));
            return helper.ButtonRow(buttons, rowOptions);
        }
        
        public static IHtmlContent ButtonRow(this IHtmlHelper helper, List<IHtmlContent> buttons, ButtonRowOptions? options = null)
        {
            options ??= new();
            
            List<string> classNames = new() { "form-field-row-buttons" };
            if (!string.IsNullOrEmpty(options.Classes)) { classNames.Add(options.Classes); }
            if (options.Thin) { classNames.Add("form-field-row-thin"); }
            if (options.Tight) { classNames.Add("form-field-row-tight"); }

            string row = $"<form-field-row {Attribute("class", string.Join(" ", classNames))}{Attribute("style", $"justify-content:{options.Justify.DisplayName()};")}{Attributes(options.HtmlAttributes)}>";
            buttons.ForEach(b => row += b);
            return helper.Raw($"{row}</form-field-row>");
        }
        
                
        private static bool IsNumeric(this Type myType) => NumericTypes.Contains(Nullable.GetUnderlyingType(myType) ?? myType);
        private static bool IsUnsigned(this Type myType) => UnsignedNumericTypes.Contains(Nullable.GetUnderlyingType(myType) ?? myType);
        
        private static readonly HashSet<Type> NumericTypes = new HashSet<Type>
        {
            typeof(int), typeof(double), typeof(decimal), typeof(long), typeof(short), typeof(sbyte), typeof(byte), typeof(ulong), typeof(ushort), typeof(uint), typeof(float)
        };
        private static readonly HashSet<Type> UnsignedNumericTypes = new HashSet<Type>
        {
            typeof(ulong), typeof(ushort), typeof(uint)
        };
        
        private static string Attributes(Dictionary<string, string>? attributes)
        {
            if (attributes == null)
            {
                return "";
            }
            return string.Join("", attributes.Select(a => Attribute(a.Key, a.Value)));
        }
        
        private static string Attribute(string name, string? value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return "";
            }
            return $"{name}=\"{value}\" ";
        }

        private static string IconOrBlank(this IHtmlHelper helper, Icon? icon)
        {
            if (icon != null)
            {
                icon.FixedWidth = true;
                return helper.Icon(icon).ToString() ?? "";
            }
            return "";
        }
    }
}