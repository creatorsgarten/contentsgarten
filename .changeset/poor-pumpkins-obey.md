---
'contentsgarten': major
---

Removed the ACL system, in favor of simple code-based configuration.

In previous versions, granting edit access to the wiki is done by creating a `contentsgarten.config.yml` with configuration like this:

```yaml
policies:
  - name: Allow anyone in "creators" team to edit the page contents
    permission: edit
    team: creatorsgarten/creators
```

Now, the authorization logic is configured directly in the code. When calling `createContentsgarten`, you can pass in a `authorizer` function that determines whether the user can edit the wiki or not.

```js
    authorizer: async ({ gitHub, user }) => {
      if (await gitHub.isUserInTeam(user, 'creatorsgarten', 'creators')) {
        return { granted: true }
      }
      return {
        granted: false,
        reason: 'You should be in the "creators" team to edit the wiki.',
      }
    },
```

This eliminated ~400 lines of code and the error messages are now more user-friendly.