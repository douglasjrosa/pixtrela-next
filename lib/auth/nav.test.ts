import { describe, it, expect } from "vitest";

import {
  colaboratorMenuItems,
  homeHrefForRole,
  navItemsForRole,
  staffNavItemsForRole,
} from "./nav";



function hrefs(role: Parameters<typeof navItemsForRole>[0]) {

  return navItemsForRole(role).map((item) => item.href);

}



describe("navItemsForRole", () => {

  it("sends colaborator home links to private path when userId is set", () => {

    expect(navItemsForRole("colaborator", { userId: "col-1" }).map((i) => i.href))

      .toEqual(["/col-1", "/col-1/store", "/col-1/orders", "/col-1/profile"]);

    expect(

      navItemsForRole("colaborator", { userId: "col-1" }).map((i) => i.labelKey),

    ).toEqual(["dashboard", "store", "exchange", "profile"]);

  });



  it("exposes dashboard and store for the colaborator header menu", () => {

    expect(colaboratorMenuItems("col-1")).toEqual([

      { href: "/col-1", labelKey: "dashboard" },

      { href: "/col-1/store", labelKey: "store" },

      { href: "/col-1/orders", labelKey: "exchange" },

    ]);

  });



  it("falls back to panel root when colaborator has no userId", () => {

    expect(hrefs("colaborator")).toEqual(["/"]);

  });



  it("does not include profile in staff navbar", () => {
    expect(navItemsForRole("manager", { userId: "mgr-1" }).map((i) => i.href))
      .not.toContain("/mgr-1/profile");
    expect(navItemsForRole("leader", { userId: "lead-1" }).map((i) => i.href))
      .not.toContain("/lead-1/profile");
    expect(navItemsForRole("admin", { userId: "admin-1" }).map((i) => i.href))
      .not.toContain("/admin-1/profile");
  });



  it("shows consolidated staff nav to leader without manager sections", () => {

    const result = hrefs("leader");

    expect(result).toEqual(

      expect.arrayContaining(["/", "/board", "/tasks", "/queues"]),

    );

    expect(result).not.toContain("/templates/tasks");

    expect(result).not.toContain("/teams");

    expect(result).not.toContain("/users");

    expect(result).not.toContain("/awards");

    expect(result).not.toContain("/exchanges");

    expect(result).not.toContain("/settings/logs");

  });



  it("shows awards section to manager without top-level users or exchanges", () => {

    const result = hrefs("manager");

    expect(result).toEqual(

      expect.arrayContaining([

        "/",

        "/board",

        "/tasks",

        "/queues",

        "/awards",

      ]),

    );

    expect(result).not.toContain("/users");

    expect(result).not.toContain("/exchanges");

    expect(result).not.toContain("/templates/tasks");

    expect(result).not.toContain("/settings/logs");

  });



  it("admin sees every top-level staff section including settings", () => {

    const result = hrefs("admin");

    expect(result).toEqual(

      expect.arrayContaining([

        "/",

        "/board",

        "/tasks",

        "/queues",

        "/awards",

        "/settings/logs",

      ]),

    );

  });

});



describe("staffNavItemsForRole", () => {

  it("uses custom paths for kiosk staff URLs", () => {

    expect(

      staffNavItemsForRole("leader", {

        panel: "/kiosk/staff/u1",

        board: "/kiosk/staff/u1/board",

        tasks: "/kiosk/staff/u1/tasks",

        queues: "/kiosk/staff/u1/queues",

        awards: "/kiosk/staff/u1/awards",

        settings: "/kiosk/staff/u1/settings/files",

      }).map((item) => item.href),

    ).toEqual(

      expect.arrayContaining([

        "/kiosk/staff/u1",

        "/kiosk/staff/u1/board",

        "/kiosk/staff/u1/tasks",

        "/kiosk/staff/u1/queues",

      ]),

    );

  });

});



describe("homeHrefForRole", () => {

  it("routes colaborator and kiosk to their homes", () => {

    expect(homeHrefForRole("colaborator", "col-1")).toBe("/col-1");

    expect(homeHrefForRole("kiosk")).toBe("/kiosk");

    expect(homeHrefForRole("manager")).toBe("/");

  });

});


