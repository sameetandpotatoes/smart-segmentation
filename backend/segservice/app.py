from flask import Flask, request
import functools
import inspect
import json
import logging.config
import os
from werkzeug.datastructures import MultiDict
import sys
import yaml

import logging
_log = logging.getLogger(__name__)

FAILURE_KEY = 'failure'

def identity(x):
    return x

class ParameterDecodingError(Exception):
    """Raised when parameter data decoding fails
    
    Raising this exception during 
    """

class MethodInvoker:
    class InvalidApiMethodError(TypeError):
        """Exception raised when the given """
    
    def __init__(self, handler):
        self.handler = handler
        self.param_interpreter = identity
        
        if isinstance(handler, functools.partial):
            skip_n, skip_names = (len(handler.args), handler.keywords.keys())
        else:
            skip_n, skip_names = (0, frozenset())
        
        has_one_positional_arg = False
        for i, param in enumerate(inspect.signature(handler).parameters.values()):
            if i < skip_n or param.name in skip_names:
                continue
            
            if not has_one_positional_arg:
                if param.kind is param.POSITIONAL_OR_KEYWORD:
                    has_one_positional_arg = True
                    
                    # If it has an annotation, treat that as the type to pass in and
                    # capture the type's "from_json_data" classmethod
                    if param.annotation is not param.empty:
                        self.param_interpreter = param.annotation.from_request_data
                        if not callable(self.param_interpreter):
                            raise InvalidApiMethodError(
                                "{}.from_request_data is not callable".format(param.annotation)
                            )
                elif param.kind is param.VAR_POSITIONAL:
                    has_one_positional_arg = True
            else:
                if (
                    param.kind is param.POSITIONAL_OR_KEYWORD
                    and param.default is param.empty
                ):
                    raise self.InvalidApiMethodError(
                        "{}.{} must accept and require (at most) one positional parameter".format(
                            handler.__module__,
                            handler.__qualname__
                        )
                    )
    
    def __call__(self, args):
        try:
            decoded_args = self.param_interpreter(args)
        except Exception as e:
            _log.debug("%r failed to interpret %r", self.param_interpreter, args)
            raise
        
        try:
            result = self.handler(decoded_args)
        except Exception as e:
            _log.debug("%r failed to handle %r", self.handler, decoded_args)
            raise
        
        if hasattr(result, 'to_response_data'):
            result = result.to_response_data()
        
        return result

class Application(Flask):
    environment = os.environ.get('FLASK_ENV', 'development')
    
    def method(self, path_to_bind, non_qs_params=()):
        """Decorater for declaring an exposed API method
        
        The function decorated will be called with one positional argument.
        If the decorated function annotates it's first positional argument
        with an object (usually a type), that object must provide a
        ``from_request_data`` attribute which, when called with the request
        data (as described below), returns the object to be passed to the API
        method.  The simplest way to implement this is to decorate the argument
        with a class that defines ``from_request_data`` as a
        :func:`classmethod` accepting one argument and returning an instance
        of the class.  If the argument is not annotated, then the request data
        is passed to the decorated function unchanged.
        
        Request data is taken from three sources; earlier sources in this list
        supercede the values provided by later sources (i.e. have higher
        priority):
        
        * Arguments bound in the URL path (i.e. *path_to_bind*)
        * Arguments in the JSON request body
        * Arguments in the query string (but not those listed in *non_qs_params*)
        
        The API method handler is expected to return a value which will be
        converted to JSON.  If the value returned has a ``to_response_data``
        method, that method will be called (with no arguments) and the result
        will be converted to JSON for transmission.
        
        If the hander function detects any problems with the input data, it
        should raise a :class:`ParameterDecodingError`.
        
        To declare a partial application of a function as an exposed API method,
        see :attr:`partial` of the function returned by this method::
            
            app.method("/path/to/bind").partial(multi_handler, bound_arg, bound_keyword=value)
        
        """
        def binder(fn):
            
            invoker = MethodInvoker(fn)
            
            # wrap fn and call self.route on the wrapper
            def view(**kwargs):
                method_params = dict(request.args.items())
                for pname in non_qs_params:
                    method_params.pop(pname, None)
                method_params.update(request.get_json(True))
                method_params.update(kwargs)
                
                try:
                    result = invoker(method_params)
                except ParameterDecodingError as e:
                    _log.info("Request for %r failed with 400 -- bad parameters", path_to_bind)
                    response = {FAILURE_KEY: 'invalid argument value(s)'}
                    if e.__cause__ is not None:
                        response[FAILURE_KEY] = str(e)
                    return (json.dumps(response), 400, {'Content-Type': 'application/json'})
                except Exception:
                    _log.exception("Request for %r failed with 500 -- unexpected exception", path_to_bind)
                    return (json.dumps({FAILURE_KEY: 'unexpected server error'}), 500, {'Content-Type': 'application/json'})
                
                return (json.dumps(result), 200, {'Content-Type': 'application/json'})
            
            view._handler = fn
            
            # Copy attributes used by routing and error reporting
            for attr in ('__module__', '__name__', '__qualname__'):
                setattr(view, attr, getattr(fn, attr))
            
            # Create route, but only for POST method
            self.route(path_to_bind, methods=['POST'])(view)
            
            return fn
        
        # Function implementing partial-binding of a function; assign to the
        # 'partial' attribute of the returned function.
        def partial_binder(fn, *args, **kwargs):
            """Bind a partial application of a function to an API endpoint
            
            This uses :func:`functools.partial` to partially apply the given
            function, which is then fully applied when invoked via the API
            binding.
            
            This method accepts the same parameters as :func:`functools.partial`
            """
            return binder(_make_partial_thunk(fn, args, kwargs))
        binder.partial = partial_binder
        
        return binder

def _make_partial_thunk(fn, args, kwargs):
    thunk = functools.update_wrapper(
        functools.partial(fn, *args, **kwargs),
        fn
    )
    thunk.__name__ += ' ' + ', '.join(
        str(a) for a
        in itertools.chain(
            args,
            ('{}={}'.format(*item) for item in kwargs.items())
        )
    )
    return thunk

sys.modules[__name__] = instance = Application(
    __name__,
    instance_relative_config=False,
)

# See http://flask.pocoo.org/docs/0.12/config/#builtin-configuration-values for Flask configuration values
instance.config.from_object('segservice.config.setting_defaults')
instance.config.from_pyfile('config/local_config.py', silent=True)

# Configure logging
class ConfigYAMLLoader(yaml.Loader):
    class MissingConfigurationValueError(Exception):
        """Raised when a configuration value specified in a YAML file is undefined"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.add_constructor('!configval', self.get_config_value)
    
    @classmethod
    def get_config_value(cls, loader, node):
        value_name = loader.construct_scalar(node)
        try:
            return instance.config[value_name]
        except KeyError as e:
            raise self.MissingConfigurationValueError(
                "Configuration value {} is not defined in the default "
                "settings or local_config.py".format(value_name)
            ) from e

def configure_logging():
    with instance.open_resource('config/logging.yaml') as f:
        logging.config.dictConfig(yaml.load(f, Loader=ConfigYAMLLoader))
    
    adjustments = instance.config['LOGGING_ADJUSTMENTS']
    if adjustments is not None:
        adjustments = dict(adjustments, incremental = True)
        logging.config.dictConfig(adjustments)

if instance.environment != 'test':
    configure_logging()

from . import exposed_methods
