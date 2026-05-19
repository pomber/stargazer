import { renderToString } from "react-dom/server";
import { RepoHeader } from "./repo-header";

// Mock DOM environment for server-side rendering tests
declare global {
  namespace NodeJS {
    interface Global {
      document: Document;
    }
  }
}

describe("RepoHeader", () => {
  const defaultProps = {
    stars: 100,
    org: "test-org",
    name: "test-repo",
  };

  it("renders the organization name", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);
    expect(html).toContain("test-org");
  });

  it("renders the repository name", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);
    expect(html).toContain("test-repo");
  });

  it("renders the star count", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);
    expect(html).toContain("100");
  });

  it("renders the repository icon", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);
    expect(html).toContain("octicon-repo");
    expect(html).toContain("svg");
  });

  it("renders the star icon", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);
    expect(html).toContain("octicon-star");
    expect(html).toContain("svg");
  });

  it("renders the slash separator between org and repo", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);
    expect(html).toContain("color-text-secondary\">/</span>");
  });

  it("renders with correct number of stars", () => {
    const html = renderToString(<RepoHeader stars={500} org="test-org" name="test-repo" />);
    expect(html).toContain("500");
  });

  it("renders with different org and repo names", () => {
    const html = renderToString(<RepoHeader stars={10} org="another-org" name="another-repo" />);
    expect(html).toContain("another-org");
    expect(html).toContain("another-repo");
    expect(html).toContain("10");
  });

  it("applies correct CSS classes", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);

    // Check for expected CSS classes in the HTML output
    expect(html).toContain("d-flex");
    expect(html).toContain("mb-3");
    expect(html).toContain("px-3");
    expect(html).toContain("px-md-4");
    expect(html).toContain("px-lg-5");
  });

  it("has correct structure with author and repo name in h1", () => {
    const html = renderToString(<RepoHeader {...defaultProps} />);

    // Check that the h1 contains both the organization and repository name
    expect(html).toContain("h1");
    expect(html).toContain("test-org");
    expect(html).toContain("test-repo");
  });

  it("renders all required props correctly", () => {
    const testProps = { stars: 50, org: "my-org", name: "my-repo" };
    const html = renderToString(<RepoHeader {...testProps} />);

    expect(html).toContain("50");
    expect(html).toContain("my-org");
    expect(html).toContain("my-repo");
  });
});