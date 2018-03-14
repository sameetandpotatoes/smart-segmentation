from datetime import datetime
import operator
from segservice import app

### BEGIN EXAMPLE ###
# Uncomment the decorator line "@app.method(..." on the definition of
# ``calculate`` below to activate this calculator.

class Calculator:
    OPERATION_MAP = {
        '+': operator.add,
        '-': operator.sub,
        '*': operator.mul,
        '/': operator.truediv,
    }
    
    def __init__(self, ):
        self.stack = []
        self.operation = None
    
    @classmethod
    def from_request_data(cls, jd):
        instance = cls()
        instance.stack = jd['stack']
        instance.operation = jd.get('operation')
        return instance
    
    def to_response_data(self, ):
        result = dict(
            stack=self.stack,
        )
        if self.operation is not None:
            result['operation'] = self.operation
        return result
    
    def execute(self, ):
        stack, op = self.stack, self.operation
        if op not in self.OPERATION_MAP:
            stack.append("unknown operation {!r}".format(op))
        elif len(stack) < 2:
            stack.append("stack underflow executing {!r}".format(op))
        else:
            try:
                stack[-2:] = [self.OPERATION_MAP[op](*stack[-2:])]
            except Exception as e:
                stack.append("error executing {!r}: {}".format(op, e))
        self.operation = None

# @app.method("/calculate", non_qs_params=['stack'])
def calculate(c: Calculator):
    c.execute()
    return c

### END EXAMPLE ###

# This is for a health check and uses app.route instead of app.method
@app.route("/is-up")
def health_response():
    return "Service is up at {}.\n".format(
        app.now().strftime("%H:%M:%S %Z on %b %-d, %Y")
    )
