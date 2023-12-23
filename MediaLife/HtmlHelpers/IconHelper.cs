using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Linq;
using MediaLife.HtmlHelpers.Extensions;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace MediaLife.HtmlHelpers
{
    public class Icon
    {
        public string NameOrEmoji { get; set; }
        public IconStyle Style { get; set; }
        public bool FixedWidth { get; set; } = false;
        public IconAnimation? Animation { get; set; } = null;
        public IconRotate? Rotate { get; set; } = null;

        public Icon(string nameOrEmoji, IconStyle? style = null)
        {
            NameOrEmoji = nameOrEmoji;
            Style = style ?? IconStyle.Regular;
        }

        public string Classes()
        {
            List<string> classes = new();
            if (!IsEmoji()) { classes.AddRange(new List<string>() { Style.DisplayName(), $"fa-{NameOrEmoji}" }); }
            if (FixedWidth) { classes.Add("fa-fw"); }
            if (Animation != null) { classes.Add(Animation.Classes()); }
            if (Rotate != null) { classes.Add(Rotate.DisplayName()); }
            return string.Join(" ", classes);
        }

        public string Styles()
        {
            List<string> styles = new();
            if (Animation != null) { styles.Add(Animation.Styles()); }
            return string.Join(" ", styles);
        }

        public bool IsEmoji()
        {
            return new StringInfo(NameOrEmoji).LengthInTextElements == 1;
        }
    }

    public class RegularIcon : Icon
    {
        public RegularIcon(string nameOrEmoji) : base(nameOrEmoji) { }
    }

    public class SolidIcon : Icon
    {
        public SolidIcon(string nameOrEmoji) : base(nameOrEmoji, IconStyle.Solid) { }
    }

    public class BrandIcon : Icon
    {
        public BrandIcon(string nameOrEmoji) : base(nameOrEmoji, IconStyle.Brands) { }
    }

    public abstract class IconAnimation
    {
        /// <summary>Set an initial delay for animation in Milliseconds</summary>
        public int? Delay { get; set; } = null;
        /// <summary>Set direction for animation. Any valid CSS animation-direction value</summary>
        public string? Direction { get; set; } = null;
        /// <summary>Set duration for animation in Milliseconds</summary>
        public int? Duration { get; set; } = null;
        /// <summary>Set number of iterations for animation	A number (e.g. 1, 1.5, etc) or null for infinite</summary>
        public float? Iterations { get; set; } = null;
        /// <summary>Set how the animation progresses through frames	Any valid CSS animation-timing-function value</summary>
        public string? Timing { get; set; } = null;

        public virtual string Classes() => "";
        public virtual string Styles()
        {
            List<string> styles = new();
            if (Delay != null) { styles.Add($"--fa-animation-delay:{Delay}ms;"); }
            if (Direction != null) { styles.Add($"--fa-animation-direction:{Direction};"); }
            if (Duration != null) { styles.Add($"--fa-animation-duration:{Duration}ms;"); }
            if (Iterations != null) { styles.Add($"--fa-animation-iteration-count:{Iterations};"); }
            if (Timing != null) { styles.Add($"--fa-animation-timing:{Timing};"); }
            return string.Join(" ", styles);
        }
    }

    public class BeatAnimation : IconAnimation
    {
        /// <summary>Set max value that an icon will scale</summary>
        public float? Scale { get; set; } = null;

        public override string Classes() => string.Join(" ", new List<string>() { base.Classes(), "fa-beat" });
        public override string Styles()
        {
            List<string> styles = new() { base.Styles() };
            if (Scale != null) { styles.Add($"--fa-beat-scale:{Scale};"); }
            return string.Join(" ", styles);
        }
    }
    public class FadeAnimation : IconAnimation
    {
        /// <summary>Set lowest opacity value an icon will fade to and from</summary>
        public float? Opacity { get; set; } = null;

        public override string Classes() => string.Join(" ", new List<string>() { base.Classes(), "fa-fade" });
        public override string Styles()
        {
            List<string> styles = new() { base.Styles() };
            if (Opacity != null) { styles.Add($"--fa-fade-opacity:{Opacity};"); }
            return string.Join(" ", styles);
        }
    }
    public class BeatFadeAnimation : IconAnimation
    {
        /// <summary>Set lowest opacity value an icon will fade to and from</summary>
        public float? FadeOpacity { get; set; } = null;
        /// <summary>Set max value that an icon will scale</summary>
        public float? FadeScale { get; set; } = null;

        public override string Classes() => string.Join(" ", new List<string>() { base.Classes(), "fa-beat-fade" });
        public override string Styles()
        {
            List<string> styles = new() { base.Styles() };
            if (FadeOpacity != null) { styles.Add($"--fa-beat-fade-opacity:{FadeOpacity};"); }
            if (FadeScale != null) { styles.Add($"--fa-beat-fade-scale:{FadeScale};"); }
            return string.Join(" ", styles);
        }
    }
    public class BounceAnimation : IconAnimation
    {
        /// <summary>Set the amount of rebound an icon has when landing after the jump</summary>
        public int? Rebound { get; set; } = null;
        /// <summary>Set the max height an icon will jump to when bouncing</summary>
        public int? Height { get; set; } = null;
        /// <summary>Set the icon's horizontal distortion ("squish") when starting to bounce</summary>
        public float? StartScaleX { get; set; } = null;
        /// <summary>Set the icon's vertical distortion ("squish") when starting to bounce</summary>
        public float? StartScaleY { get; set; } = null;
        /// <summary>Set the icon's horizontal distortion ("squish") at the top of the jump</summary>
        public float? JumpScaleX { get; set; } = null;
        /// <summary>Set the icon's vertical distortion ("squish") at the top of the jump</summary>
        public float? JumpScaleY { get; set; } = null;
        /// <summary>Set the icon's horizontal distortion ("squish") when landing after the jump</summary>
        public float? LandScaleX { get; set; } = null;
        /// <summary>Set the icon's vertical distortion ("squish") when landing after the jump</summary>
        public float? LandScaleY { get; set; } = null;

        public override string Classes() => string.Join(" ", new List<string>() { base.Classes(), "fa-bounce" });
        public override string Styles()
        {
            List<string> styles = new() { base.Styles() };
            if (Rebound != null) { styles.Add($":--fa-bounce-rebound:{Rebound}px;"); }
            if (Height != null) { styles.Add($"--fa-bounce-height:{Height}px;"); }
            if (StartScaleX != null) { styles.Add($"--fa-bounce-start-scale-x:{StartScaleX};"); }
            if (StartScaleY != null) { styles.Add($"--fa-bounce-start-scale-y:{StartScaleY};"); }
            if (JumpScaleX != null) { styles.Add($"--fa-bounce-jump-scale-x:{JumpScaleX};"); }
            if (JumpScaleY != null) { styles.Add($"--fa-bounce-jump-scale-y:{JumpScaleY};"); }
            if (LandScaleX != null) { styles.Add($"--fa-bounce-land-scale-x:{LandScaleX};"); }
            if (LandScaleY != null) { styles.Add($"--fa-bounce-land-scale-y:{LandScaleY};"); }
            return string.Join(" ", styles);
        }
    }
    public class FlipAnimation : IconAnimation
    {
        /// <summary>Set x-coordinate of the vector denoting the axis of rotation (between 0 and 1)</summary>
        public float? FlipX { get; set; } = null;
        /// <summary>Set y-coordinate of the vector denoting the axis of rotation (between 0 and 1)</summary>
        public float? FlipY { get; set; } = null;
        /// <summary>Set z-coordinate of the vector denoting the axis of rotation (between 0 and 1)</summary>
        public float? FlipZ { get; set; } = null;
        /// <summary>Set rotation angle of flip. A positive angle denotes a clockwise rotation, a negative angle a counter-clockwise one.</summary>
        public int? FlipAngle { get; set; } = null;

        public override string Classes() => string.Join(" ", new List<string>() { base.Classes(), "fa-flip" });
        public override string Styles()
        {
            List<string> styles = new() { base.Styles() };
            if (FlipX != null) { styles.Add($"--fa-flip-x:{FlipX};"); }
            if (FlipY != null) { styles.Add($"--fa-flip-y:{FlipY};"); }
            if (FlipZ != null) { styles.Add($"--fa-flip-z:{FlipZ};"); }
            if (FlipAngle != null) { styles.Add($"--fa-flip-angle:{FlipAngle};"); }
            return string.Join(" ", styles);
        }
    }
    public class ShakeAnimation : IconAnimation
    {
        public override string Classes() => string.Join(" ", new List<string>() { base.Classes(), "fa-shake" });
        public override string Styles() => base.Styles();
    }
    public class SpinAnimation : IconAnimation
    {
        /// <summary>Makes an icon spin counter-clockwise.</summary>
        public bool? Reverse { get; set; } = null;

        public override string Classes()
        {
            List<string> classes = new() { base.Classes(), "fa-spin" };
            if (Reverse == true) { classes.Add("fa-spin-reverse"); }
            return string.Join(" ", classes);
        }
        public override string Styles() => base.Styles();
    }
    public class SpinPulseAnimation : IconAnimation
    {
        /// <summary>Makes an icon spin counter-clockwise.</summary>
        public bool? Reverse { get; set; } = null;

        public override string Classes()
        {
            List<string> classes = new() { base.Classes(), "fa-spin-pulse" };
            if (Reverse == true) { classes.Add("fa-spin-reverse"); }
            return string.Join(" ", classes);
        }
        public override string Styles() => base.Styles();
    }

    public enum IconStyle
    {
        [Display(Name = "fa-solid")]
        Solid,
        [Display(Name = "fa-regular")]
        Regular,
        [Display(Name = "fa-brands")]
        Brands,
    }

    public enum IconRotate
    {
        [Display(Name = "fa-rotate-90")]
        Rotate90,
        [Display(Name = "fa-rotate-180")]
        Rotate180,
        [Display(Name = "fa-rotate-270")]
        Rotate270,
        [Display(Name = "fa-flip-horizontal")]
        FlipHorizontal,
        [Display(Name = "fa-flip-vertical")]
        FlipVertical,
        [Display(Name = "fa-flip-both")]
        FlipBoth,
    }


    public static class IconHelper
    {
        public static IHtmlContent Icon(this IHtmlHelper helper, string iconNameOrEmoji, string? label = null, string? action = null, string? classes = null, Dictionary<string, string>? htmlAttributes = null)
            => helper.Icon(new Icon(iconNameOrEmoji), label, action, classes, htmlAttributes);
        
        public static IHtmlContent Icon(this IHtmlHelper helper, Icon icon, string? label = null, string? action = null, string? classes = null, Dictionary<string, string>? htmlAttributes = null)
        {
            string iconClasses = icon.Classes();
            if (label == null && action == null && classes != null) { iconClasses += $" {classes}"; }

            string styles = $"{icon.Styles()}";
            string attributes = label == null && action == null ? Attributes(htmlAttributes) : "";

            string html = icon.IsEmoji() ? icon.NameOrEmoji : "";

            if (label != null || action != null)
            {
                html = $"<icon {Attribute("class", iconClasses)}{Attribute("style", styles)}{attributes}>{html}</icon>";
                if (!string.IsNullOrEmpty(label)) { html += $"<span class=\"label\">{label}</span>"; }

                if (action == null)
                {
                    classes += (string.IsNullOrEmpty(classes) ? "" : " ") + "icon-wrapper";
                    html = $"<icon-and-label {Attribute("class", classes)}{Attributes(htmlAttributes)}>{html}</icon-and-label>";
                }
                else
                {
                    string href = action;
                    string onclick = "";
                    if (action.Contains('(') && action.Contains(')'))
                    {
                        href = "JavaScript:;";
                        onclick = $" onclick=\"{action}\"";
                    }
                    html = $"<icon-link class=\"icon-wrapper\"><a href=\"{href}\"{onclick} {Attribute("class", classes)}{Attributes(htmlAttributes)}>{html}</a></icon-link>";
                }
            }
            else
            {
                iconClasses += (string.IsNullOrEmpty(iconClasses) ? "" : " ") + "icon-wrapper";
                html = $"<icon {Attribute("class", iconClasses)}{Attribute("style", styles)}{attributes}>{html}</icon>";
            }

            return helper.Raw(html);
        }
        
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
    }
}