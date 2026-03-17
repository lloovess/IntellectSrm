# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e9]: Вход в SRM
      - generic [ref=e10]: Введите ваш email и пароль для доступа к системе
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email
          - textbox "Email" [ref=e15]:
            - /placeholder: admin@intellect.edu
        - generic [ref=e16]:
          - generic [ref=e17]:
            - generic [ref=e18]: Пароль
            - link "Забыли пароль?" [ref=e19] [cursor=pointer]:
              - /url: "#"
          - textbox "Пароль" [ref=e20]:
            - /placeholder: ••••••••
      - button "Войти" [ref=e22]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
    - img [ref=e29]
  - alert [ref=e32]
```