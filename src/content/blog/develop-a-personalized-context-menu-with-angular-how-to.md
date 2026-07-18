---
title: "Develop a Personalized Context Menu with Angular: How-To"
tags: [angularjs, typescript, angular-material]
date: 2023-12-15
description: "Develop a custom Angular context menu using Angular Material, mat-menu, and mat-dialog components in a step-by-step guide"
draft: false
---


## Introduction

Recently, I had to create a custom context menu for my project. In my organization, we use Angular Material. When I searched online, I found many ways to create it. However, I used a few approaches that worked well for me.

## Approach

These are the approaches I had in mind:

* Using `mat-menu`
    
* Using `mat-dialog`
    

Before proceeding further, here is the project setup:

| Package | Version |
| --- | --- |
| Angular | v17 |
| Node | v18.17.1 |
| NPM | v9.6.7 |

### Using Angular Material Menu

In this article, I will explain how to use the Angular mat-menu to create a custom component. The mat-menu component is very easy to configure and use, which is why I chose this approach.

Create a custom component `context-menu` and put the below HTML snippet.

#### context-menu-component.html

```xml
<div [matMenuTriggerFor]="contextMenu" style="visibility: hidden; position: absolute;" [style.left]="left"
     [style.top]="top"></div>
<mat-menu #contextMenu="matMenu">
  <button mat-menu-item>Item 1</button> 
  <button mat-menu-item>Item 2</button>
  <button mat-menu-item>Item 3</button>
</mat-menu>
```

In above code snippet:

1. Create a mat-menu with your desired buttons and button groups.
    
2. I have added a `div` which works as the trigger / container for menu to open. I have added `left` and `top`, to control the position of the menu to appear as the `div`.
    

#### context-menu-component.ts

```typescript
export class ContextMenuComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  @Input() top!: string;
  @Input() left!: string;
  @Input() showContextMenu!: Observable<boolean>;
  showContextMenuSubscription?: Subscription;
  ngAfterViewInit() {
    this.showContextMenuSubscription = this.showContextMenu.subscribe({
      next: (show) => show && this.menuTrigger.openMenu()
    });
  }
  ngOnDestroy() {
    this.showContextMenuSubscription?.unsubscribe();
  }
}
```

I have added three inputs, `top`, `left`, and `showContextMenu`. As mentioned earlier, top and left are used to control the position of the menu and `showContextMenu` controls when to open the menu.

Here `MatMenuTrigger` is referred using `@ViewChild` and the template contains the hidden `div`. This is the reason for having a hidden `div`.

In `app-component.html`, add `contextmenu` event to anything. In this event listener, note down the click location `clientX` and `clientY`.

#### app-component.html

```xml
<app-context-menu [left]="left" [top]="top" [showContextMenu]="showContextMenu.asObservable()"></app-context-menu>
<div style="display: grid; place-items: center;">
  <div style="width: 75%; height: 20rem; margin-top: 10rem; background-color: #ccc; position: relative;" (contextmenu)="openContextMenu($event)">
    <span
      style="font-size: 1.2rem;opacity: 0.5; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%">Right Click in highlighted area to open the context menu</span>
  </div>
</div>
```

#### app-component.ts

```typescript
export class AppComponent {
  top = '0';
  left = '0';
  showContextMenu = new BehaviorSubject(false);
  openContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.top = event.clientY + 'px';
    this.left = event.clientX + 'px';
    this.showContextMenu.next(true);
  }
}
```

As you can see, a `contextmenu` event is registered on a `div`. The `app-context-menu` has a listener which first

* Prevents the default behavior
    
* Sets the `clientX` and `clientY` to `top` and `left` respectively
    
* Emits an event to `showContextMenu` is true.
    

When user right-click on the specified zone, you will get a context menu with your custom menu items.

## Prototype:

You can check the complete code at [Github](https://github.com/themuler/custom-context-menu/tree/main)

The outcome of this component looks like this:

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1702675144887/4e179818-db2d-4970-a4f7-832bc8f332c5.png align="center")

As you see here, the custom context menu will not appear in the outer part of the zone shown above.

Feel free to comment. Thanks for your time.
