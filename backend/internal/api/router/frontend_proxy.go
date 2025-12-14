package router

import (
	"errors"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func newFrontendProxy(target string) (*httputil.ReverseProxy, error) {
	if target == "" {
		return nil, errors.New("frontend proxy target is empty")
	}

	targetURL, err := url.Parse(target)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	// Keep original host for the upstream so Next.js can build correct absolute URLs.
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)

		if forwardedHost := req.Header.Get("X-Forwarded-Host"); forwardedHost != "" {
			req.Host = forwardedHost
		}
	}

	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
		log.Printf("frontend proxy error: %v", err)
		http.Error(rw, "frontend unavailable", http.StatusBadGateway)
	}

	return proxy, nil
}
