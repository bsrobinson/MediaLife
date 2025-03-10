﻿using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Attributes;
using System.Collections.Generic;
using WCKDRZR.Gaspar;
using System;
using System.Reflection;

namespace MediaLife.Controllers
{
    [Authorised]
    public class UsersApiController : Controller
    {
        private MySqlContext db;

        public UsersApiController(MySqlContext context)
        {
            db = context;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("[controller]/[action]")]
        public ActionResult<List<User>> GetUsers()
        {
            return db.Users.ToList();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("[controller]/[action]")]
        public ActionResult<List<UserAccount>> GetAccounts()
        {
            return db.UserAccounts.ToList();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]")]
        public ActionResult<bool> AddAccount(string username)
        {
            UserAccount newAccount = new() { Name = $"{username}'s Account" };
            db.UserAccounts.Add(newAccount);
            db.SaveChanges();

            User user = new() { Name = username, Password = Guid.NewGuid().ToString(), AccountId = newAccount.AccountId, Role = UserRole.AccountAdmin };
            db.Users.Add(user);
            db.SaveChanges();

            return true;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]/{accountId}")]
        public ActionResult<UserAccount> RenameAccount(uint accountId, string name)
        {
            UserAccount? account = db.UserAccounts.FirstOrDefault(a => a.AccountId == accountId);
            if (account == null)
            {
                return NotFound();
            }

            account.Name = name;
            db.SaveChanges();

            return account;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]/{accountId}")]
        public ActionResult<User> AddUser(uint accountId, string username)
        {
            UserAccount? account = db.UserAccounts.FirstOrDefault(a => a.AccountId == accountId);
            if (account == null)
            {
                return NotFound();
            }

            User user = new() { Name = username, Password = Guid.NewGuid().ToString(), AccountId = account.AccountId, Role = UserRole.User };
            db.Users.Add(user);
            db.SaveChanges();

            return user;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]")]
        public ActionResult<User> EditUser([FromBody] User userModel)
        {
            User? user = db.Users.FirstOrDefault(u => u.UserId == userModel.UserId && u.AccountId == userModel.AccountId);
            if (user == null)
            {
                return NotFound();
            }

            foreach (PropertyInfo property in typeof(User).GetProperties().Where(p => p.CanWrite))
            {
                property.SetValue(user, property.GetValue(userModel, null), null);
            }
            db.SaveChanges();

            return user;
        }

    }
}