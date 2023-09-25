using System;
using System.Collections.Generic;
using MediaLife.Models;

namespace MediaLife.Extensions
{
	public static class StringPathExtensions
	{
        public static string? FileName(this string path)
        {
            if (!string.IsNullOrEmpty(path))
            {
                if (!path.Contains("/"))
                {
                    return path;
                }

                int fileNameStart = path.LastIndexOf("/") + 1;
                if (fileNameStart > 0)
                {
                    string fileName = path.Substring(fileNameStart);
                    if (fileName.StartsWith(".")) { fileName = fileName.Substring(1); }

                    return fileName;
                }
            }
            return null;
        }

        public static string WithoutExtension(this string fileName)
        {
            string? extension = fileName.Extension();
            if (extension != null)
            {
                return fileName[..(fileName.LastIndexOf(extension) - 1)];
            }
            return fileName;
        }

        public static string? Extension(this string fileName)
        {
            int extensionStart = fileName.LastIndexOf(".") + 1;
            if (extensionStart > 0)
            {
                string extension = fileName[extensionStart..].ToLower();
                if (extension == "icloud")
                {
                    return fileName[..(extensionStart - 1)].Extension();
                }
                return extension;
            }
            return null;
        }

        public static bool IsVideoFile(this string fileName)
        {
            string? extension = fileName.Extension();
            if (extension != null)
            {
                List<string> videoFileExtensions = new() { "3g2", "3gp", "amv", "asf", "avi", "drc", "f4a", "f4b", "f4p", "f4v", "flv", "flv", "flv", "gif", "gifv", "m2ts", "m2v", "m4p", "m4v", "m4v", "mkv", "mng", "mov", "mp2", "mp4", "mpe", "mpeg", "mpeg", "mpg", "mpg", "mpv", "mts", "mxf", "nsv", "ogg", "ogv", "qt", "rm", "rmvb", "roq", "svi", "ts", "viv", "vob", "webm", "wmv", "yuv" };
                return videoFileExtensions.Contains(extension);
            }

            return false;
        }
    }
}