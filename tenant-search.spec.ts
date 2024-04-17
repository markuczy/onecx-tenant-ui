import { Type } from "@angular/core";
import {
  ActivatedRoute,
  NavigationExtras,
  Router,
  RouterState,
  RouterStateSnapshot,
  RoutesRecognized,
} from "@angular/router";
import { ROUTER_NAVIGATED, RouterNavigatedAction } from "@ngrx/router-store";
import { MockStore, createMockStore } from "@ngrx/store/testing";
import { ReplaySubject, of, throwError } from "rxjs";
import { hot } from "jasmine-marbles";
import {
  CreateOrEditSearchConfigDialogComponent,
  PortalDialogService,
  PortalMessageService,
} from "@onecx/portal-integration-angular";
import {
  SearchConfigBffService,
  TenantBffService,
} from "src/app/shared/generated";
import { TenantSearchEffects } from "./tenant-search.effects";
import { TenantSearchActions } from "./tenant-search.actions";
import {
  selectSearchConfigViewState,
  selectSearchCriteria,
  tenantSearchSelectors,
} from "./tenant-search.selectors";
import { TenantSearchComponent } from "./tenant-search.component";

class MockRouter implements Partial<Router> {
  constructor(effectsActions: ReplaySubject<any>) {
    this.effectsActions = effectsActions;
  }
  events = new ReplaySubject<any>(1);
  routerState = {
    root: {},
    snapshot: {
      root: {},
    },
  } as RouterState;
  effectsActions: ReplaySubject<any>;

  routeFor = (component: Type<any>) => {
    this.routerState!.root!.component! = component;
  };

  setRouterUrl = (url: string) => {
    this.routerState!.snapshot.url = url;
  };

  configureNavigationUrl = (
    routerAction: RouterNavigatedAction,
    currentUrl: string,
    newUrl: string
  ) => {
    this.setRouterUrl(currentUrl);
    routerAction.payload = {
      event: {
        urlAfterRedirects: newUrl,
      },
    } as any;
  };

  setRouterParams = (params: any) => {
    this.routerState!.snapshot.root.queryParams = params;
  };

  configureQueryParams = (
    routerAction: RouterNavigatedAction,
    routerParams: any,
    actionParams: any
  ) => {
    this.setRouterParams(routerParams);
    routerAction.payload = {
      routerState: {
        root: {
          queryParams: actionParams,
        },
      },
    } as any;
  };

  simulateNavigation = (routerAction: RouterNavigatedAction) => {
    (this.events as ReplaySubject<any>).next(
      new RoutesRecognized(0, "", "", {} as RouterStateSnapshot)
    );
    this.effectsActions.next(routerAction);
  };

  navigate(
    commands: any[],
    extras?: NavigationExtras | undefined
  ): Promise<boolean> {
    console.log("aaaa");
    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    } as RouterNavigatedAction;
    routerNavigatedAction.payload = {
      routerState: {
        root: {
          queryParams: extras?.queryParams,
        },
      },
    } as any;
    this.simulateNavigation(routerNavigatedAction);
    return Promise.resolve(true);
  }
}

describe("TenantSearchEffects:", () => {
  let activatedRouteMock: Partial<ActivatedRoute> = {};
  let mockedRouter: MockRouter;
  let store: MockStore;
  const initialState = {};

  const mockedTenantService: Partial<TenantBffService> = {
    searchTenants: jest.fn(),
  };
  const mockedSearchConfigService: Partial<SearchConfigBffService> = {
    getSearchConfigInfos: jest.fn(),
    getSearchConfig: jest.fn(),
    createSearchConfig: jest.fn(),
  };
  const mockedMessageService: Partial<PortalMessageService> = {
    error: jest.fn(),
  };
  const mockedDialogService: Partial<PortalDialogService> = {
    openDialog: jest.fn(),
  };

  let effectsActions: ReplaySubject<any>;
  const initEffects = () => {
    return new TenantSearchEffects(
      effectsActions,
      activatedRouteMock as ActivatedRoute,
      mockedTenantService as TenantBffService,
      mockedSearchConfigService as SearchConfigBffService,
      mockedRouter as any,
      store,
      mockedMessageService as PortalMessageService,
      mockedDialogService as PortalDialogService
    );
  };

  beforeEach(() => {
    effectsActions = new ReplaySubject<any>(1);
    activatedRouteMock.queryParams = new ReplaySubject<any>(1);
    mockedRouter = new MockRouter(effectsActions);
    store = createMockStore({ initialState });
    jest.resetAllMocks();
  });

  it("should display error when TenantSearchActions.tenantSearchResultsLoadingFailed dispatched", (done) => {
    const effects = initEffects();
    effectsActions.next(
      TenantSearchActions.tenantSearchResultsLoadingFailed({
        error: null,
      })
    );

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenLastCalledWith({
        summaryKey:
          "TENANT_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED",
      });
      done();
    });
  });

  it("should display error when TenantSearchActions.searchConfigCreationFailed dispatched", (done) => {
    const effects = initEffects();
    effectsActions.next(
      TenantSearchActions.searchConfigCreationFailed({
        error: null,
      })
    );

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenLastCalledWith({
        summaryKey:
          "TENANT_SEARCH.ERROR_MESSAGES.SEARCH_CONFIG_CREATION_FAILED",
      });
      done();
    });
  });

  it("should display error when TenantSearchActions.searchConfigUpdateFailed dispatched", (done) => {
    const effects = initEffects();
    effectsActions.next(
      TenantSearchActions.searchConfigUpdateFailed({
        error: null,
      })
    );

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenLastCalledWith({
        summaryKey: "TENANT_SEARCH.ERROR_MESSAGES.SEARCH_CONFIG_UPDATE_FAILED",
      });
      done();
    });
  });

  it("should not display error when action without error mapping dispatched", (done) => {
    const effects = initEffects();
    // any not mapped action
    effectsActions.next(TenantSearchActions.chartVisibilityToggled());

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenCalledTimes(0);
      done();
    });
  });

  it("should save visible: true to localStorage when TenantSearchActions.chartVisibilityToggled dispatched", (done) => {
    jest.spyOn(Storage.prototype, "setItem");

    store.overrideSelector(tenantSearchSelectors.selectChartVisible, true);

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.chartVisibilityToggled());

    effects.saveChartVisibility$.subscribe(() => {
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        "tenantChartVisibility",
        "true"
      );
      done();
    });
  });

  it("should save visible: false to localStorage when TenantSearchActions.chartVisibilityToggled dispatched", (done) => {
    jest.spyOn(Storage.prototype, "setItem");

    store.overrideSelector(tenantSearchSelectors.selectChartVisible, false);

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.chartVisibilityToggled());

    effects.saveChartVisibility$.subscribe(() => {
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        "tenantChartVisibility",
        "false"
      );
      done();
    });
  });

  it("should dispatch TenantSearchActions.chartVisibilityRehydrated with visible: true on TenantSearchComponent route navigation", (done) => {
    let localStorageSpy = jest.spyOn(Storage.prototype, "getItem");
    localStorageSpy.mockReturnValue("true");

    const effects = initEffects();

    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    } as RouterNavigatedAction;
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.configureNavigationUrl(
      routerNavigatedAction,
      "current_url",
      "navigation_url"
    );
    mockedRouter.simulateNavigation(routerNavigatedAction);

    effects.rehydrateChartVisibility$.subscribe((action) => {
      expect(action.visible).toBe(true);
      done();
    });
  });

  it("should dispatch TenantSearchActions.chartVisibilityRehydrated with visible: false on TenantSearchComponent route navigation", (done) => {
    let localStorageSpy = jest.spyOn(Storage.prototype, "getItem");
    localStorageSpy.mockReturnValue("false");

    const effects = initEffects();

    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    } as RouterNavigatedAction;
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.configureNavigationUrl(
      routerNavigatedAction,
      "current_url",
      "navigation_url"
    );
    mockedRouter.simulateNavigation(routerNavigatedAction);

    effects.rehydrateChartVisibility$.subscribe((action) => {
      expect(action.visible).toBe(false);
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigInfosReceived with fetched configs on TenantSearchComponent route navigation", (done) => {
    jest
      .spyOn(mockedSearchConfigService, "getSearchConfigInfos")
      .mockReturnValue(
        of({
          configs: [
            { id: "1", name: "config_1" },
            { id: "2", name: "config_2" },
          ],
        } as any)
      );

    const effects = initEffects();

    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    } as RouterNavigatedAction;
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.configureNavigationUrl(
      routerNavigatedAction,
      "current_url",
      "navigation_url"
    );
    mockedRouter.simulateNavigation(routerNavigatedAction);

    effects.loadSearchConfigInfos$.subscribe((action) => {
      expect(
        mockedSearchConfigService.getSearchConfigInfos
      ).toHaveBeenLastCalledWith("tenant-search");
      expect(action.searchConfigInfos).toEqual([
        { id: "1", name: "config_1" },
        { id: "2", name: "config_2" },
      ]);
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigReceived with fetched config on TenantSearchActions.selectedSearchConfigInfo", (done) => {
    const returnedConfig = {
      name: "config_name",
      isReadonly: true,
    };
    jest.spyOn(mockedSearchConfigService, "getSearchConfig").mockReturnValue(
      of({
        config: returnedConfig,
      } as any)
    );

    const effects = initEffects();
    effectsActions.next(
      TenantSearchActions.selectedSearchConfigInfo({
        searchConfigInfo: { id: "1", name: "config" },
      })
    );

    effects.loadSearchConfig$.subscribe((action) => {
      expect(
        mockedSearchConfigService.getSearchConfig
      ).toHaveBeenLastCalledWith("1");
      expect(action).toEqual({
        type: TenantSearchActions.searchConfigReceived.type,
        searchConfig: returnedConfig,
      });
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigsLoadingFailed with failed config fetch on TenantSearchActions.selectedSearchConfigInfo", (done) => {
    const error = {
      cause: "Bad id",
    };
    jest
      .spyOn(mockedSearchConfigService, "getSearchConfig")
      .mockReturnValue(throwError(() => error));

    const effects = initEffects();
    effectsActions.next(
      TenantSearchActions.selectedSearchConfigInfo({
        searchConfigInfo: { id: "1", name: "config" },
      })
    );

    effects.loadSearchConfig$.subscribe((action) => {
      expect(
        mockedSearchConfigService.getSearchConfig
      ).toHaveBeenLastCalledWith("1");
      expect(action).toEqual({
        type: TenantSearchActions.searchConfigsLoadingFailed.type,
        error: error,
      });
      done();
    });
  });

  it("should dispatch TenantSearchActions.tenantSearchResultsReceived with search results on new search criteria", (done) => {
    const tenants = {
      stream: [
        {
          id: "1",
        },
        {
          id: "2",
        },
      ],
      totalElements: 2,
    };
    jest
      .spyOn(mockedTenantService, "searchTenants")
      .mockReturnValue(of(tenants) as any);

    const previousSearchCriteria = {
      orgId: "prev_org_id",
      pageNumber: 1,
      pageSize: 1,
    };
    const newSearchCriteria = {
      orgId: "org_id",
      pageNumber: 1,
      pageSize: 1,
    };
    store.overrideSelector(selectSearchCriteria, newSearchCriteria);

    const effects = initEffects();

    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    } as RouterNavigatedAction;
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.configureQueryParams(
      routerNavigatedAction,
      previousSearchCriteria,
      newSearchCriteria
    );
    mockedRouter.simulateNavigation(routerNavigatedAction);

    effects.searchByUrl$.subscribe((action) => {
      expect(mockedTenantService.searchTenants).toHaveBeenLastCalledWith(
        newSearchCriteria
      );
      expect(action).toEqual({
        type: TenantSearchActions.tenantSearchResultsReceived.type,
        results: tenants.stream,
        totalElements: tenants.totalElements,
      });
      done();
    });
  });

  it("should dispatch TenantSearchActions.tenantSearchResultsLoadingFailed when search call fails on new search criteria", (done) => {
    const error = {
      cause: "Bad org id",
    };
    jest
      .spyOn(mockedTenantService, "searchTenants")
      .mockReturnValue(throwError(() => error));

    const previousSearchCriteria = {
      orgId: "prev_org_id",
      pageNumber: 1,
      pageSize: 1,
    };
    const newSearchCriteria = {
      orgId: "org_id",
      pageNumber: 1,
      pageSize: 1,
    };
    store.overrideSelector(selectSearchCriteria, newSearchCriteria);

    const effects = initEffects();

    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    } as RouterNavigatedAction;
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.configureQueryParams(
      routerNavigatedAction,
      previousSearchCriteria,
      newSearchCriteria
    );
    mockedRouter.simulateNavigation(routerNavigatedAction);

    effects.searchByUrl$.subscribe((action) => {
      expect(mockedTenantService.searchTenants).toHaveBeenLastCalledWith(
        newSearchCriteria
      );
      expect(action).toEqual({
        type: TenantSearchActions.tenantSearchResultsLoadingFailed.type,
        error: error,
      });
      done();
    });
  });

  it("should not dispatch anything via searchByUrl on same search criteria", () => {
    const sameSearchCriteria = {
      orgId: "org_id",
      pageNumber: 1,
      pageSize: 1,
    };

    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    } as RouterNavigatedAction;
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.configureQueryParams(
      routerNavigatedAction,
      sameSearchCriteria,
      { orgId: "ass" }
    );

    const effects = initEffects();
    effectsActions.next(
      hot("-a", {
        a: routerNavigatedAction,
      })
    );

    const expected = hot("--");

    expect(effects.searchByUrl$).toBeObservable(expected);
  });

  it("should dispatch TenantSearchActions.tenantSearchResultsReceived with the results on TenantSearchActions.searchButtonClicked dispatch", (done) => {
    const tenants = {
      stream: [
        {
          id: "1",
        },
        {
          id: "2",
        },
      ],
      totalElements: 2,
    };
    jest
      .spyOn(mockedTenantService, "searchTenants")
      .mockReturnValue(of(tenants) as any);

    const effects = initEffects();
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.setRouterParams({});
    (activatedRouteMock.queryParams as ReplaySubject<any>).next({});
    effectsActions.next(
      TenantSearchActions.searchButtonClicked({
        searchCriteria: { orgId: "" },
      })
    );

    effects.searchButtonClicked$.subscribe(() => {});

    effects.searchByUrl$.subscribe((action) => {
      expect(action).toEqual({
        type: TenantSearchActions.tenantSearchResultsReceived.type,
        results: tenants.stream,
        totalElements: tenants.totalElements,
      });
      done();
    });
  });

  it("should not dispatch any searchByUrl related action on TenantSearchActions.resetButtonClicked dispatch", () => {
    const effects = initEffects();
    mockedRouter.routeFor(TenantSearchComponent);
    (activatedRouteMock.queryParams as ReplaySubject<any>).next({});
    effectsActions.next(
      hot("-a", {
        a: TenantSearchActions.resetButtonClicked(),
      })
    );

    effects.resetButtonClicked$.subscribe(() => {});

    expect(effects.searchByUrl$).toBeObservable(hot("--"));
  });

  it("should dispatch TenantSearchActions.tenantSearchResultsReceived with the results on TenantSearchActions.searchConfigReceived dispatch", (done) => {
    const tenants = {
      stream: [
        {
          id: "1",
        },
        {
          id: "2",
        },
      ],
      totalElements: 2,
    };
    jest
      .spyOn(mockedTenantService, "searchTenants")
      .mockReturnValue(of(tenants) as any);

    const effects = initEffects();
    mockedRouter.routeFor(TenantSearchComponent);
    mockedRouter.setRouterParams({});
    (activatedRouteMock.queryParams as ReplaySubject<any>).next({});
    effectsActions.next(
      TenantSearchActions.searchConfigReceived({
        searchConfig: {
          values: {
            orgId: "",
          },
        } as any,
      })
    );

    effects.searchConfigReceived$.subscribe(() => {});

    effects.searchByUrl$.subscribe((action) => {
      expect(action).toEqual({
        type: TenantSearchActions.tenantSearchResultsReceived.type,
        results: tenants.stream,
        totalElements: tenants.totalElements,
      });
      done();
    });
  });

  it("should not dispatch any searchByUrl related action on TenantSearchActions.searchConfigInfoDeselected dispatch", () => {
    const effects = initEffects();
    mockedRouter.routeFor(TenantSearchComponent);
    (activatedRouteMock.queryParams as ReplaySubject<any>).next({});
    effectsActions.next(
      hot("-a", {
        a: TenantSearchActions.searchConfigInfoDeselected(),
      })
    );

    effects.resetButtonClicked$.subscribe(() => {});

    expect(effects.searchByUrl$).toBeObservable(hot("--"));
  });

  it("should open dialog on TenantSearchActions.createSearchConfigClicked", (done) => {
    const effects = initEffects();
    effectsActions.next(TenantSearchActions.createSearchConfigClicked());

    effects.createSearchConfig$.subscribe(() => {
      expect(mockedDialogService.openDialog).toHaveBeenLastCalledWith(
        "TENANT_SEARCH.HEADER_ACTIONS.CREATE_SEARCH_CONFIG",
        CreateOrEditSearchConfigDialogComponent,
        "TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CONFIRM",
        "TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CANCEL"
      );
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigCreationCancelled if secondary dialog button clicked", (done) => {
    jest.spyOn(mockedDialogService, "openDialog").mockReturnValue(
      of({
        button: "secondary",
      } as any)
    );

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.createSearchConfigClicked());

    effects.createSearchConfig$.subscribe((action) => {
      expect(action).toEqual(
        TenantSearchActions.searchConfigCreationCancelled()
      );
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigCreatedSuccessfully if primary dialog button clicked and config was created", (done) => {
    const configs = {
      totalElements: 2,
      configs: [
        {
          id: "1",
          name: "config_1",
        },
        {
          id: "2",
          name: "config_2",
        },
      ],
    };
    jest
      .spyOn(mockedSearchConfigService, "createSearchConfig")
      .mockReturnValue(of(configs as any));

    jest.spyOn(mockedDialogService, "openDialog").mockReturnValue(
      of({
        button: "primary",
        result: {
          searchConfigName: "chosen_config",
          saveColumns: true,
          saveInputValues: true,
        },
      } as any)
    );

    store.overrideSelector(selectSearchConfigViewState, {
      viewMode: "advanced",
      columns: [
        {
          id: "1",
        },
        {
          id: "col_2",
        },
      ],
      searchCriteria: {
        orgId: "my_org_id",
      },
    } as any);

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.createSearchConfigClicked());

    effects.createSearchConfig$.subscribe((action) => {
      expect(
        mockedSearchConfigService.createSearchConfig
      ).toHaveBeenLastCalledWith({
        page: "tenant",
        fieldListVersion: 0,
        name: "chosen_config",
        isReadonly: false,
        isAdvanced: true,
        columns: ["1", "col_2"],
        values: {
          orgId: "my_org_id",
        },
      });
      expect(action).toEqual(
        TenantSearchActions.searchConfigCreatedSuccessfully({
          searchConfigInfos: configs.configs as any,
        })
      );
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigCreationFailed if primary dialog button clicked and config was not created", (done) => {
    const error = "No connection";
    jest
      .spyOn(mockedSearchConfigService, "createSearchConfig")
      .mockReturnValue(throwError(() => error));

    jest.spyOn(mockedDialogService, "openDialog").mockReturnValue(
      of({
        button: "primary",
        result: {
          searchConfigName: "chosen_config",
          saveColumns: true,
          saveInputValues: true,
        },
      } as any)
    );

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.createSearchConfigClicked());

    effects.createSearchConfig$.subscribe((action) => {
      expect(action).toEqual(
        TenantSearchActions.searchConfigCreationFailed({
          error: error,
        })
      );
      done();
    });
  });

  it("should open dialog with config data on TenantSearchActions.updateSearchConfigClicked", (done) => {
    store.overrideSelector(tenantSearchSelectors.selectSelectedSearchConfig, {
      name: "config_name",
      values: {
        org_id: "",
      },
      columns: [
        {
          id: "col_1",
        },
      ],
    } as any);
    const effects = initEffects();
    effectsActions.next(TenantSearchActions.updateSearchConfigClicked());

    effects.updateSearchConfig$.subscribe(() => {
      expect(mockedDialogService.openDialog).toHaveBeenLastCalledWith(
        "CONSTRUCTION_TASK_SEARCH.HEADER_ACTIONS.UPDATE_SEARCH_CONFIG",
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: "config_name",
            saveInputValues: true,
            saveColumns: true,
          },
        },
        "TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CONFIRM",
        "TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CANCEL"
      );
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigUpdateCancelled if secondary dialog button clicked", (done) => {
    jest.spyOn(mockedDialogService, "openDialog").mockReturnValue(
      of({
        button: "secondary",
      } as any)
    );

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.updateSearchConfigClicked());

    effects.updateSearchConfig$.subscribe((action) => {
      expect(action).toEqual(TenantSearchActions.searchConfigUpdateCancelled());
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigUpdatedSuccessfully if primary dialog button clicked and config was updated", (done) => {
    const configs = {
      totalElements: 2,
      configs: [
        {
          id: "1",
          name: "config_1",
        },
        {
          id: "2",
          name: "config_2",
        },
      ],
    };
    jest
      .spyOn(mockedSearchConfigService, "createSearchConfig")
      .mockReturnValue(of(configs as any));

    jest.spyOn(mockedDialogService, "openDialog").mockReturnValue(
      of({
        button: "primary",
        result: {
          searchConfigName: "chosen_config",
          saveColumns: true,
          saveInputValues: true,
        },
      } as any)
    );

    store.overrideSelector(selectSearchConfigViewState, {
      viewMode: "advanced",
      columns: [
        {
          id: "1",
        },
        {
          id: "col_2",
        },
      ],
      searchCriteria: {
        orgId: "my_org_id",
      },
    } as any);

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.updateSearchConfigClicked());

    effects.updateSearchConfig$.subscribe((action) => {
      expect(
        mockedSearchConfigService.createSearchConfig
      ).toHaveBeenLastCalledWith({
        page: "tenant",
        fieldListVersion: 0,
        name: "chosen_config",
        isReadonly: false,
        isAdvanced: true,
        columns: ["1", "col_2"],
        values: {
          orgId: "my_org_id",
        },
      });
      expect(action).toEqual(
        TenantSearchActions.searchConfigUpdatedSuccessfully({
          searchConfigInfos: configs.configs as any,
        })
      );
      done();
    });
  });

  it("should dispatch TenantSearchActions.searchConfigCreationFailed if primary dialog button clicked and config was not created", (done) => {
    const error = "No connection";
    jest
      .spyOn(mockedSearchConfigService, "createSearchConfig")
      .mockReturnValue(throwError(() => error));

    jest.spyOn(mockedDialogService, "openDialog").mockReturnValue(
      of({
        button: "primary",
        result: {
          searchConfigName: "chosen_config",
          saveColumns: true,
          saveInputValues: true,
        },
      } as any)
    );

    const effects = initEffects();
    effectsActions.next(TenantSearchActions.updateSearchConfigClicked());

    effects.updateSearchConfig$.subscribe((action) => {
      expect(action).toEqual(
        TenantSearchActions.searchConfigUpdateFailed({
          error: error,
        })
      );
      done();
    });
  });
});
